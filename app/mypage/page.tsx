"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  XP_MAP, LEVELS, getLevelInfo, getXpForExam, getRecommendations,
  type LevelInfo,
} from "@/lib/gamification";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type UserQual = {
  id: string;
  exam_name: string;
  xp_earned: number;
  obtained_at: string;
  source: string;
};

type RankUser = {
  user_id: string;
  display_name: string;
  total_xp: number;
  qual_count: number;
};

const ALL_QUAL_NAMES = Object.keys(XP_MAP).sort((a, b) => a.localeCompare(b, "ja"));
const MEDAL: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

export default function MyPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profile" | "ranking">("profile");
  const [quals, setQuals] = useState<UserQual[]>([]);
  const [rankUsers, setRankUsers] = useState<RankUser[]>([]);
  const [rankLoaded, setRankLoaded] = useState(false);
  const [searchExam, setSearchExam] = useState("");
  const [addExam, setAddExam] = useState("");
  const [addDate, setAddDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelInfo | null>(null);

  const totalXp = quals.reduce((sum, q) => sum + q.xp_earned, 0);
  const levelInfo = getLevelInfo(totalXp);
  const ownedExamNames = quals.map((q) => q.exam_name);
  const recommendations = getRecommendations(ownedExamNames);
  const filteredQuals = ALL_QUAL_NAMES.filter(
    (n) => !ownedExamNames.includes(n) &&
      (searchExam === "" || n.toLowerCase().includes(searchExam.toLowerCase()) || n.includes(searchExam))
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        upsertProfile(session);
        fetchQuals(session.user.id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (tab === "ranking" && !rankLoaded) fetchRanking();
  }, [tab]);

  const upsertProfile = async (session: any) => {
    await supabase.from("user_profiles").upsert({
      user_id: session.user.id,
      display_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
      email: session.user.email,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  };

  const fetchQuals = async (userId: string) => {
    const { data } = await supabase
      .from("user_qualifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setQuals(data);
  };

  const fetchRanking = async () => {
    const [{ data: profiles }, { data: allQuals }] = await Promise.all([
      supabase.from("user_profiles").select("user_id, display_name, email"),
      supabase.from("user_qualifications").select("user_id, xp_earned"),
    ]);
    if (profiles && allQuals) {
      const xpMap: Record<string, number> = {};
      const cntMap: Record<string, number> = {};
      for (const q of allQuals) {
        xpMap[q.user_id] = (xpMap[q.user_id] || 0) + q.xp_earned;
        cntMap[q.user_id] = (cntMap[q.user_id] || 0) + 1;
      }
      const ranked = profiles
        .map((p) => ({
          user_id: p.user_id,
          display_name: p.display_name || p.email?.split("@")[0] || "???",
          total_xp: xpMap[p.user_id] || 0,
          qual_count: cntMap[p.user_id] || 0,
        }))
        .sort((a, b) => b.total_xp - a.total_xp);
      setRankUsers(ranked);
      setRankLoaded(true);
    }
  };

  const addQualification = async () => {
    if (!addExam || !session) return;
    const xp = getXpForExam(addExam);
    const prevLevel = levelInfo.current.level;
    setAdding(true);

    const { error } = await supabase.from("user_qualifications").insert({
      user_id: session.user.id,
      exam_name: addExam,
      xp_earned: xp,
      obtained_at: addDate || new Date().toISOString().split("T")[0],
      source: "manual",
    });

    if (!error) {
      const newLevelInfo = getLevelInfo(totalXp + xp);
      if (newLevelInfo.current.level > prevLevel) setLevelUpInfo(newLevelInfo.current);
      await fetchQuals(session.user.id);
      setAddExam("");
      setSearchExam("");
      setAddDate("");
      setShowDropdown(false);
    }
    setAdding(false);
  };

  const removeQual = async (id: string) => {
    if (!confirm("この資格の記録を削除しますか？")) return;
    await supabase.from("user_qualifications").delete().eq("id", id);
    await fetchQuals(session.user.id);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white mb-4">ログインが必要です</p>
        <Link href="/" className="text-indigo-400 hover:text-white transition-colors">← ホームへ</Link>
      </div>
    </div>
  );

  const myRankIdx = rankUsers.findIndex((u) => u.user_id === session.user.id);
  const myRank = myRankIdx >= 0 ? myRankIdx + 1 : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative">
      <div className="fixed top-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Level Up Modal */}
      {levelUpInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setLevelUpInfo(null)}
        >
          <div className="bg-slate-900 border border-yellow-400/40 rounded-3xl p-10 text-center shadow-2xl shadow-yellow-500/20 max-w-sm mx-4">
            <div className="text-6xl mb-4 animate-bounce">{levelUpInfo.icon}</div>
            <p className="text-yellow-300 font-black text-lg tracking-widest uppercase mb-2">Level Up！</p>
            <p className="text-white text-4xl font-black mb-1">Lv.{levelUpInfo.level}</p>
            <p className={`text-transparent bg-clip-text bg-gradient-to-r ${levelUpInfo.color} font-black text-xl mb-6`}>
              {levelUpInfo.title}
            </p>
            <button
              onClick={() => setLevelUpInfo(null)}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black px-8 py-3 rounded-2xl hover:from-yellow-400 hover:to-amber-400 transition-all"
            >
              やった！🎉
            </button>
          </div>
        </div>
      )}

      <div className="relative max-w-2xl mx-auto p-5 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
          >
            ← ホームに戻る
          </Link>
          <span className="text-[10px] text-indigo-400/50 font-bold tracking-widest uppercase">MY PAGE</span>
        </div>

        {/* Profile Hero Card */}
        <div className={`bg-gradient-to-br ${levelInfo.current.color} p-0.5 rounded-3xl mb-6 shadow-2xl`}>
          <div className="bg-slate-900/92 backdrop-blur-xl rounded-[22px] p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${levelInfo.current.color} flex items-center justify-center text-3xl shrink-0 shadow-lg`}>
                {levelInfo.current.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-lg leading-tight truncate">
                  {session.user.user_metadata?.full_name || session.user.email?.split("@")[0]}
                </p>
                <p className="text-indigo-400/60 text-xs truncate">{session.user.email}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r ${levelInfo.current.color} text-white shadow`}>
                    Lv.{levelInfo.current.level}
                  </span>
                  <span className="text-indigo-200/80 text-xs font-bold">{levelInfo.current.title}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-white font-black text-2xl">{totalXp.toLocaleString()}</p>
                <p className="text-indigo-400/50 text-[10px] font-bold uppercase tracking-widest">Total XP</p>
                <p className="text-indigo-400/50 text-[10px] mt-0.5">{quals.length} 資格</p>
              </div>
            </div>

            {/* XP Progress Bar */}
            {levelInfo.next ? (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-indigo-400/60 font-bold">
                    次のレベルまで {((levelInfo.xpForNext ?? 0) - levelInfo.xpInLevel).toLocaleString()} XP
                  </span>
                  <span className="text-[10px] text-indigo-400/60 font-bold">
                    {levelInfo.next.icon} Lv.{levelInfo.next.level} {levelInfo.next.title}
                  </span>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${levelInfo.current.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-indigo-500/40">{levelInfo.current.xp.toLocaleString()} XP</span>
                  <span className="text-[9px] text-indigo-500/40">{levelInfo.next.xp.toLocaleString()} XP</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-1">
                <span className="text-yellow-300 font-black text-sm">🏆 最高レベル到達！伝説のエンジニア</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/5 border border-white/10 rounded-2xl p-1.5">
          {[
            { key: "profile", label: "🎖 マイ資格" },
            { key: "ranking", label: "🏆 ランキング" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${
                tab === t.key
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30"
                  : "text-indigo-400/60 hover:text-indigo-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== マイ資格タブ ===== */}
        {tab === "profile" && (
          <div className="space-y-6">
            {/* Add Qualification */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[10px] text-indigo-400/60 font-bold tracking-widest uppercase mb-3">➕ 資格を追加（手動）</p>
              <div className="relative mb-3">
                <input
                  className="w-full bg-white/8 border border-white/15 px-4 py-2.5 rounded-xl text-white placeholder-indigo-400/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                  placeholder="資格名を検索して選択..."
                  value={addExam || searchExam}
                  onChange={(e) => {
                    setSearchExam(e.target.value);
                    setAddExam("");
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && searchExam && !addExam && (
                  <div className="absolute z-10 w-full mt-1 max-h-52 overflow-y-auto bg-slate-800 border border-white/15 rounded-xl shadow-2xl">
                    {filteredQuals.slice(0, 15).length === 0 ? (
                      <p className="text-indigo-400/50 text-xs px-4 py-3">該当なし</p>
                    ) : (
                      filteredQuals.slice(0, 15).map((name) => (
                        <button
                          key={name}
                          onMouseDown={() => {
                            setAddExam(name);
                            setSearchExam(name);
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center justify-between"
                        >
                          <span className="text-indigo-100/85 font-semibold">{name}</span>
                          <span className="text-indigo-400/60 text-xs shrink-0 ml-2">+{getXpForExam(name)} XP</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="bg-white/8 border border-white/15 px-3 py-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
                <button
                  onClick={addQualification}
                  disabled={!addExam || adding}
                  className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${
                    addExam && !adding
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 active:scale-95"
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  }`}
                >
                  {adding ? "追加中..." : addExam ? `+${getXpForExam(addExam)} XP で追加` : "資格を選択してください"}
                </button>
              </div>
            </div>

            {/* Owned Qualifications */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-[10px] font-bold text-indigo-400/60 tracking-[0.3em] uppercase">保有資格</p>
                <span className="h-px bg-indigo-500/20 flex-1" />
                <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  {quals.length} 件
                </span>
              </div>
              {quals.length === 0 ? (
                <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center">
                  <p className="text-4xl mb-3">🎓</p>
                  <p className="text-indigo-400/50 text-sm">まだ資格が登録されていません</p>
                  <p className="text-indigo-400/30 text-xs mt-1">上のフォームから追加してみましょう！</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {quals.map((q) => (
                    <div key={q.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 group hover:bg-white/8 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm leading-tight truncate">{q.exam_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-indigo-400/50 text-xs">{q.obtained_at}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            q.source === "post"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}>
                            {q.source === "post" ? "📝 投稿連携" : "✋ 手動"}
                          </span>
                        </div>
                      </div>
                      <span className="text-indigo-300 font-black text-sm shrink-0">+{q.xp_earned} XP</span>
                      <button
                        onClick={() => removeQual(q.id)}
                        className="text-red-400/0 group-hover:text-red-400/60 hover:!text-red-400 transition-all text-sm font-bold shrink-0 w-5"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Recommendations */}
            {(recommendations.length > 0 || quals.length === 0) && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-[10px] font-bold text-indigo-400/60 tracking-[0.3em] uppercase">
                    🚀 {quals.length === 0 ? "まずはここから" : "次のおすすめ"}
                  </p>
                  <span className="h-px bg-indigo-500/20 flex-1" />
                </div>
                <div className="space-y-2">
                  {quals.length === 0 ? (
                    [
                      { next: "ITパスポート", from: "入門", xp: 100 },
                      { next: "AWS Cloud Practitioner", from: "クラウド入門", xp: 100 },
                      { next: "基本情報技術者試験（FE）", from: "エンジニア登竜門", xp: 300 },
                    ].map((r) => (
                      <div key={r.next} className="flex items-center gap-4 bg-gradient-to-r from-emerald-600/10 to-teal-600/5 border border-emerald-500/20 rounded-xl px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm leading-tight">{r.next}</p>
                          <p className="text-emerald-400/60 text-xs mt-0.5">{r.from}</p>
                        </div>
                        <span className="text-emerald-300 font-black text-sm shrink-0">+{r.xp} XP</span>
                      </div>
                    ))
                  ) : (
                    recommendations.map((r) => (
                      <div key={r.next} className="flex items-center gap-4 bg-gradient-to-r from-indigo-600/10 to-violet-600/5 border border-indigo-500/20 rounded-xl px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm leading-tight">{r.next}</p>
                          <p className="text-indigo-400/60 text-xs mt-0.5">{r.from} の次のステップ</p>
                        </div>
                        <span className="text-indigo-300 font-black text-sm shrink-0">+{r.xp} XP</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== ランキングタブ ===== */}
        {tab === "ranking" && (
          <div>
            {!rankLoaded ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-indigo-400/60 text-sm">ランキングを読み込み中...</p>
              </div>
            ) : rankUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-indigo-400/50 text-sm">まだランキングデータがありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rankUsers.map((user, idx) => {
                  const isMe = user.user_id === session.user.id;
                  const medal = MEDAL[idx];
                  const uLevel = getLevelInfo(user.total_xp);
                  return (
                    <div
                      key={user.user_id}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all ${
                        isMe
                          ? "bg-gradient-to-r from-indigo-600/20 to-violet-600/15 border-indigo-500/40 shadow-lg shadow-indigo-500/10"
                          : idx < 3
                          ? "bg-white/8 border-white/15"
                          : "bg-white/4 border-white/8"
                      }`}
                    >
                      <div className="w-8 text-center shrink-0">
                        {medal
                          ? <span className="text-2xl">{medal}</span>
                          : <span className="text-indigo-400/50 font-black text-sm">{idx + 1}</span>
                        }
                      </div>
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${uLevel.current.color} flex items-center justify-center text-lg shrink-0`}>
                        {uLevel.current.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-black text-sm truncate ${isMe ? "text-white" : "text-indigo-100/80"}`}>
                            {user.display_name}
                          </p>
                          {isMe && (
                            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold shrink-0">YOU</span>
                          )}
                        </div>
                        <p className="text-indigo-400/50 text-[10px]">
                          Lv.{uLevel.current.level} {uLevel.current.title} · {user.qual_count}資格
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-black text-sm ${
                          idx === 0 ? "text-yellow-300" :
                          idx === 1 ? "text-slate-300" :
                          idx === 2 ? "text-amber-500" : "text-indigo-300/70"
                        }`}>
                          {user.total_xp.toLocaleString()}
                        </p>
                        <p className="text-indigo-400/40 text-[10px]">XP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 自分の順位を固定表示（ランキングタブ表示中） */}
      {tab === "ranking" && rankLoaded && myRank !== null && myRank > 10 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-slate-900/95 backdrop-blur-xl border-t border-indigo-500/30">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <span className="text-indigo-400/60 font-black text-sm w-8 text-center">{myRank}</span>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${levelInfo.current.color} flex items-center justify-center text-lg shrink-0`}>
              {levelInfo.current.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-black text-sm truncate">
                  {session.user.user_metadata?.full_name || session.user.email?.split("@")[0]}
                </p>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold shrink-0">YOU</span>
              </div>
              <p className="text-indigo-400/50 text-[10px]">Lv.{levelInfo.current.level} · {quals.length}資格</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-indigo-300 font-black text-sm">{totalXp.toLocaleString()}</p>
              <p className="text-indigo-400/40 text-[10px]">XP</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
