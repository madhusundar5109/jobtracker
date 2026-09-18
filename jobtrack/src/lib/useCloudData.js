import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

export const TABLES = ["jobs", "applications", "outreach", "contacts", "interviews", "resumes", "companies", "templates"];
const emptyData = Object.fromEntries(TABLES.map(t => [t, []]));

function rowToItem(row) {
  return { id: row.id, ...row.payload };
}

/**
 * Loads all entity tables for the signed-in user, keeps them live via
 * Supabase Realtime (so a change on the phone shows up on the laptop and
 * vice versa), and exposes the same addItem/updateItem/deleteItem
 * interface the UI already expects.
 */
export function useCloudData(user) {
  const [data, setData] = useState(emptyData);
  const [loaded, setLoaded] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const channelsRef = useRef([]);

  const fetchAll = useCallback(async () => {
    if (!user) { setData(emptyData); setLoaded(true); return; }
    setLoaded(false);
    const results = await Promise.all(
      TABLES.map(t => supabase.from(t).select("id,payload").eq("user_id", user.id).order("created_at", { ascending: false }))
    );
    const next = {};
    TABLES.forEach((t, i) => {
      const { data: rows, error } = results[i];
      if (error) { console.error(`Failed to load ${t}:`, error.message); next[t] = []; }
      else next[t] = (rows || []).map(rowToItem);
    });
    setData(next);
    setLoaded(true);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime: keep every open device in sync
  useEffect(() => {
    channelsRef.current.forEach(ch => supabase.removeChannel(ch));
    channelsRef.current = [];
    if (!user) return;

    TABLES.forEach(table => {
      const channel = supabase
        .channel(`sync-${table}-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table, filter: `user_id=eq.${user.id}` },
          payload => {
            setData(d => {
              const rows = [...d[table]];
              if (payload.eventType === "DELETE") {
                return { ...d, [table]: rows.filter(r => r.id !== payload.old.id) };
              }
              const item = rowToItem(payload.new);
              const idx = rows.findIndex(r => r.id === item.id);
              if (idx >= 0) rows[idx] = item; else rows.unshift(item);
              return { ...d, [table]: rows };
            });
          }
        )
        .subscribe();
      channelsRef.current.push(channel);
    });

    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [user]);

  async function addItem(entity, obj) {
    const tempId = "temp-" + Math.random().toString(36).slice(2);
    setData(d => ({ ...d, [entity]: [{ id: tempId, ...obj }, ...d[entity]] }));
    const { data: row, error } = await supabase.from(entity).insert({ user_id: user.id, payload: obj }).select().single();
    if (error) {
      console.error(`Failed to add ${entity}:`, error.message);
      setData(d => ({ ...d, [entity]: d[entity].filter(x => x.id !== tempId) }));
      return null;
    }
    const item = rowToItem(row);
    setData(d => ({ ...d, [entity]: d[entity].map(x => x.id === tempId ? item : x) }));
    return item;
  }

  async function updateItem(entity, id, patch) {
    if (id.toString().startsWith("temp-")) return; // still saving, ignore edits until it lands
    setData(d => ({ ...d, [entity]: d[entity].map(x => x.id === id ? { ...x, ...patch } : x) }));
    const current = dataRef.current[entity].find(x => x.id === id) || {};
    const merged = { ...current, ...patch };
    delete merged.id;
    const { error } = await supabase.from(entity).update({ payload: merged, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) console.error(`Failed to update ${entity}:`, error.message);
  }

  async function deleteItem(entity, id) {
    setData(d => ({ ...d, [entity]: d[entity].filter(x => x.id !== id) }));
    const { error } = await supabase.from(entity).delete().eq("id", id);
    if (error) console.error(`Failed to delete ${entity}:`, error.message);
  }

  return { data, loaded, addItem, updateItem, deleteItem, refresh: fetchAll };
}
