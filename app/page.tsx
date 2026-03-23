"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@headlessui/react";
import { createClient } from "@supabase/supabase-js";
import { XP_MAP, getXpForExam } from "@/lib/gamification";

const ALL_QUAL_NAMES = Object.keys(XP_MAP).sort((a, b) => a.localeCompare(b, "ja"));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const REACTION_OPTIONS = ["👍", "🙌", "💡", "🔥", "🎉"];

const CARD_GRADIENTS = [
  "from-indigo-600/30 to-blue-700/20",
  "from-violet-600/30 to-indigo-700/20",
  "from-blue-600/30 to-cyan-700/20",
  "from-purple-600/30 to-violet-700/20",
  "from-cyan-600/30 to-blue-700/20",
  "from-emerald-600/30 to-teal-700/20",
  "from-rose-600/30 to-pink-700/20",
  "from-amber-600/30 to-orange-700/20",
];

export default function Page() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  /* =====================
      データ管理
  ===================== */
  const [records, setRecords] = useState<any[]>([]);
  const [examMaster, setExamMaster] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingFields, setEditingFields] = useState<Record<string, any> | null>(null);

  // コメント用
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // 投稿詳細ページ
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  /* =====================
      入力用
  ===================== */
  const [userName, setUserName] = useState("");
  const [nameMode, setNameMode] = useState<"myname" | "anonymous">("myname");
  const [examName, setExamName] = useState("");
  const [newExamName, setNewExamName] = useState("");
  const [memo, setMemo] = useState("");
  const [examDate, setExamDate] = useState("");
  const [result, setResult] = useState("");
  const [score, setScore] = useState("");
  const [studyPeriod, setStudyPeriod] = useState("");
  const [studyTime, setStudyTime] = useState("");
  const [studyMethod, setStudyMethod] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [details, setDetails] = useState("");

  // 詳細入力項目
  const [examFee, setExamFee] = useState("");
  const [questionCount, setQuestionCount] = useState("");
  const [questionLength, setQuestionLength] = useState("");
  const [examFormat, setExamFormat] = useState("");
  const [studyMaterials, setStudyMaterials] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [effectiveMethod, setEffectiveMethod] = useState("");
  const [frequentTopics, setFrequentTopics] = useState("");
  const [challengePoints, setChallengePoints] = useState("");
  const [passingTips, setPassingTips] = useState("");
  const [adviceForNext, setAdviceForNext] = useState("");
  const [addExamInput, setAddExamInput] = useState("");
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [postFormOpen, setPostFormOpen] = useState(false);

  const filteredAddQuals = ALL_QUAL_NAMES.filter((n) =>
    addExamInput.trim() !== "" &&
    (n.toLowerCase().includes(addExamInput.toLowerCase()) || n.includes(addExamInput))
  );
  const [editingExam, setEditingExam] = useState<string | null>(null);
  const [editingExamName, setEditingExamName] = useState("");

  // 取得速報
  const [celebFeed, setCelebFeed] = useState<any[]>([]);
  const celebScrollRef = useRef<HTMLDivElement>(null);
  // ソート
  const [sortOrder, setSortOrder] = useState<"newest" | "popular" | "difficulty">("newest");
  // ブックマーク
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  // コメント通知
  const [notifCount, setNotifCount] = useState(0);
  const [lastNotifSeen, setLastNotifSeen] = useState<string | null>(null);

  const EXAM_MASTER_KEY = "shikaku_exam_master";

  const renameExam = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    setEditingExam(null);
    if (!trimmed || trimmed === oldName) return;
    await supabase.from("shikaku_memos").update({ exam_name: trimmed }).eq("exam_name", oldName);
    const updated = examMaster.map(n => n === oldName ? trimmed : n);
    setExamMaster(updated);
    localStorage.setItem("shikaku_exam_master", JSON.stringify(updated));
    if (selectedExam === oldName) setSelectedExam(trimmed);
    fetchRecords();
  };

  const deleteExam = async (name: string) => {
    const count = records.filter(r => r.exam_name === name).length;
    const msg = count > 0
      ? `「${name}」を削除しますか？\n関連する投稿 ${count} 件もすべて削除されます。`
      : `「${name}」を削除しますか？`;
    if (!confirm(msg)) return;
    if (count > 0) await supabase.from("shikaku_memos").delete().eq("exam_name", name);
    const updated = examMaster.filter(n => n !== name);
    setExamMaster(updated);
    localStorage.setItem("shikaku_exam_master", JSON.stringify(updated));
    fetchRecords();
  };

  const handleAddExam = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || examMaster.includes(trimmed)) return;
    const updated = [...examMaster, trimmed];
    setExamMaster(updated);
    localStorage.setItem(EXAM_MASTER_KEY, JSON.stringify(updated));
  };

  useEffect(() => {
    if (selectedExam) setExamName(selectedExam);
  }, [selectedExam]);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("shikaku_memos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("データ取得に失敗しました: " + error.message);
      return;
    }

    if (data) {
      setRecords(data);
      const existingExams = data.map((r: any) => r.exam_name);
      const stored: string[] = JSON.parse(localStorage.getItem("shikaku_exam_master") || "[]");
      setExamMaster(prev => Array.from(new Set([...prev, ...existingExams, ...stored])));

      if (selectedRecord) {
        const updated = data.find(r => r.id === selectedRecord.id);
        if (updated) setSelectedRecord(updated);
      }
      setSelectedPost((prev: any) => {
        if (!prev) return prev;
        const updated = data.find((r: any) => r.id === prev.id);
        return updated ?? prev;
      });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !session.user.email?.endsWith("@widsley.com")) {
        supabase.auth.signOut();
        setLoading(false);
        return;
      }
      setSession(session);
      setLoading(false);
      if (session?.user?.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !session.user.email?.endsWith("@widsley.com")) {
        supabase.auth.signOut();
        alert("このサービスはWidsley社員専用です。@widsley.com のアカウントでログインしてください。");
        return;
      }
      setSession(session);
      if (session?.user?.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchRecords();
    fetchCelebFeed();
    // ブックマークと通知を取得
    (async () => {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("bookmarks, last_notif_seen")
        .eq("user_id", session.user.id)
        .single();
      if (profile) {
        setBookmarks(profile.bookmarks || []);
        setLastNotifSeen(profile.last_notif_seen);
      }
    })();
  }, [session]);

  // URLパラメータで指定された投稿を自動オープン
  useEffect(() => {
    if (records.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const postId = params.get("post");
    if (postId) {
      const found = records.find((r: any) => r.id === Number(postId));
      if (found) setSelectedPost(found);
    }
  }, [records]);

  // コメント通知数を計算
  useEffect(() => {
    if (!session?.user?.id) return;
    const myPosts = records.filter((r: any) => r.user_id === session.user.id);
    let count = 0;
    for (const post of myPosts) {
      for (const c of (post.comments || [])) {
        if (!lastNotifSeen || new Date(c.created_at) > new Date(lastNotifSeen)) count++;
      }
    }
    setNotifCount(count);
  }, [records, lastNotifSeen, session]);

  const fetchCelebFeed = async () => {
    const [{ data: quals }, { data: posts }] = await Promise.all([
      supabase
        .from("user_qualifications")
        .select("id, exam_name, xp_earned, obtained_at, created_at, reactions, user_profiles(display_name, avatar)")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("shikaku_memos")
        .select("id, exam_name, user_name, result, difficulty, created_at, reactions, user_id")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    const qualItems = (quals || []).map((q: any) => ({ ...q, _type: "qual", _feedId: `qual_${q.id}` }));
    const postItems = (posts || []).map((p: any) => ({ ...p, _type: "post", _feedId: `post_${p.id}` }));
    const merged = [...qualItems, ...postItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 25);
    setCelebFeed(merged);
  };

  const handleCelebReaction = async (feedId: string, emoji: string) => {
    const item = celebFeed.find((c: any) => c._feedId === feedId);
    if (!item) return;
    const reactions = { ...(item.reactions || {}) };
    reactions[emoji] = (reactions[emoji] || 0) + 1;
    if (item._type === "qual") {
      await supabase.from("user_qualifications").update({ reactions }).eq("id", item.id);
    } else {
      await supabase.from("shikaku_memos").update({ reactions }).eq("id", item.id);
    }
    setCelebFeed((prev: any[]) => prev.map((c: any) => c._feedId === feedId ? { ...c, reactions } : c));
  };

  const toggleBookmark = async (postId: number) => {
    if (!session?.user?.id) return;
    const updated = bookmarks.includes(postId)
      ? bookmarks.filter(id => id !== postId)
      : [...bookmarks, postId];
    setBookmarks(updated);
    await supabase.from("user_profiles").upsert({
      user_id: session.user.id,
      bookmarks: updated,
      display_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
      email: session.user.email,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  };

  const markNotifsRead = async () => {
    if (!session?.user?.id) return;
    const now = new Date().toISOString();
    setLastNotifSeen(now);
    setNotifCount(0);
    await supabase.from("user_profiles").upsert({
      user_id: session.user.id,
      last_notif_seen: now,
      display_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
      email: session.user.email,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  };

  /* =====================
      保存・アクション
  ===================== */
  const saveRecord = async () => {
    const nameToSave = examName || selectedExam || "";
    const displayName = nameMode === "anonymous" ? "匿名" : userName;
    if ((!userName && nameMode === "myname") || !nameToSave || !memo) {
      alert("必須項目（★）を入力してください");
      return;
    }
    const detailsJson = JSON.stringify({
      examFee, questionCount, questionLength, examFormat,
      studyMaterials, studyHours, effectiveMethod,
      frequentTopics, challengePoints, passingTips, adviceForNext,
    });
    const { error } = await supabase.from("shikaku_memos").insert([{
      user_name: displayName, exam_name: nameToSave, memo,
      exam_date: examDate || null, result, score,
      study_period: studyPeriod, study_time: studyTime,
      study_method: studyMethod, difficulty, details: detailsJson,
      reactions: {}, comments: [], user_id: session?.user?.id
    }]);
    if (error) {
      alert("保存に失敗しました: " + error.message);
      return;
    }

    // パターン2: 合格投稿時にマイページの保有資格へ自動反映
    if (result === "合格" && session?.user?.id) {
      await supabase.from("user_profiles").upsert({
        user_id: session.user.id,
        display_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
        email: session.user.email,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      const { data: existing } = await supabase
        .from("user_qualifications")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("exam_name", nameToSave)
        .single();

      if (!existing) {
        await supabase.from("user_qualifications").insert({
          user_id: session.user.id,
          exam_name: nameToSave,
          xp_earned: getXpForExam(nameToSave),
          obtained_at: examDate || new Date().toISOString().split("T")[0],
          source: "post",
        });
      }
    }

    setMemo("");
    setExamFee(""); setQuestionCount(""); setQuestionLength(""); setExamFormat("");
    setStudyMaterials(""); setStudyHours(""); setEffectiveMethod("");
    setFrequentTopics(""); setChallengePoints(""); setPassingTips(""); setAdviceForNext("");
    setSelectedExam(nameToSave);
    fetchRecords();
    fetchCelebFeed();
  };

  const handleReaction = async (recordId: number, emoji: string) => {
    const record = records.find(r => r.id === recordId);
    const updatedReactions = { ...record.reactions, [emoji]: (record.reactions[emoji] || 0) + 1 };
    await supabase.from("shikaku_memos").update({ reactions: updatedReactions }).eq("id", recordId);
    fetchRecords();
  };

  const addComment = async () => {
    if (!commentName || !commentText) {
      alert("名前とコメント内容を入力してください");
      return;
    }
    const newComment = {
      id: Date.now(),
      user_name: commentName,
      text: commentText,
      created_at: new Date().toISOString()
    };
    const updatedComments = [...(selectedRecord.comments || []), newComment];
    await supabase.from("shikaku_memos").update({ comments: updatedComments }).eq("id", selectedRecord.id);
    setCommentText("");
    fetchRecords();
  };

  const deleteComment = async (post: any, commentId: number, setter: (fn: (prev: any) => any) => void) => {
    const updated = (post.comments || []).filter((c: any) => c.id !== commentId);
    await supabase.from("shikaku_memos").update({ comments: updated }).eq("id", post.id);
    setter((prev: any) => ({ ...prev, comments: updated }));
    fetchRecords();
  };

  const saveCommentEdit = async (post: any, commentId: number, newText: string, setter: (fn: (prev: any) => any) => void) => {
    const updated = (post.comments || []).map((c: any) => c.id === commentId ? { ...c, text: newText } : c);
    await supabase.from("shikaku_memos").update({ comments: updated }).eq("id", post.id);
    setter((prev: any) => ({ ...prev, comments: updated }));
    setEditingCommentId(null);
    setEditingCommentText("");
    fetchRecords();
  };

  const deleteRecord = async (id: number) => {
    if (!confirm("投稿を削除しますか？")) return;
    await supabase.from("shikaku_memos").delete().eq("id", id);
    fetchRecords();
  };

  const saveEdit = async (id: number) => {
    if (!editingFields) return;
    const detailsJson = JSON.stringify({
      examFee: editingFields.examFee,
      questionCount: editingFields.questionCount,
      questionLength: editingFields.questionLength,
      examFormat: editingFields.examFormat,
      studyMaterials: editingFields.studyMaterials,
      studyHours: editingFields.studyHours,
      effectiveMethod: editingFields.effectiveMethod,
      frequentTopics: editingFields.frequentTopics,
      challengePoints: editingFields.challengePoints,
      passingTips: editingFields.passingTips,
      adviceForNext: editingFields.adviceForNext,
    });
    await supabase.from("shikaku_memos").update({
      user_name: editingFields.user_name,
      memo: editingFields.memo,
      difficulty: editingFields.difficulty,
      details: detailsJson,
    }).eq("id", id);
    setEditingId(null);
    setEditingFields(null);
    fetchRecords();
  };

  /* =====================
      UI補助機能
  ===================== */
  const openCommentModal = (r: any) => {
    setSelectedRecord(r);
    setCommentName(userName);
    setCommentText(`@${r.user_name} `);
  };

  const goHome = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setMenuOpen(false);
    setSelectedExam(null);
    setSelectedPost(null);
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="text-indigo-400 text-sm tracking-widest uppercase animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-900/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative bg-white/10 backdrop-blur-xl border border-white/15 p-10 rounded-3xl shadow-2xl w-96">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <img src="/widsley1.png" alt="Widsley" className="h-16 w-auto object-contain drop-shadow-lg" style={{ imageRendering: "auto" }} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">SHIKAKU SHARE</h1>
            <p className="text-indigo-300/80 text-xs mt-1.5 tracking-widest uppercase">資格試験メモ共有プラットフォーム</p>
          </div>

          <button
            onClick={() => supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: window.location.origin }
            })}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 p-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all shadow-lg active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleアカウントでログイン
          </button>

          <p className="text-center text-indigo-400/60 text-[10px] mt-6 tracking-widest uppercase">社員専用サービス</p>
        </div>
      </div>
    );
  }

  const isAdmin = session?.user?.email === "arima.miura@widsley.com";

  const groupedRecords = examMaster.map(name => ({
    name,
    items: records.filter(r => r.exam_name === name)
  }));

  const filteredGroups = groupedRecords.map(group => ({
    ...group,
    items: group.items.filter(r =>
      searchQuery === "" ||
      r.exam_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.memo.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => {
    if (searchQuery) return group.items.length > 0;
    if (selectedExam) return group.name === selectedExam;
    return true;
  });

  // ソート＋ブックマークフィルター適用
  const sortedGroupedRecords = [...groupedRecords]
    .filter(g => g.items.length > 0)
    .filter(g => !showBookmarksOnly || g.items.some((r: any) => bookmarks.includes(r.id)))
    .sort((a, b) => {
      if (sortOrder === "popular") {
        const totalReactions = (g: any) => g.items.reduce((sum: number, r: any) => sum + (Object.values(r.reactions || {}) as number[]).reduce((s: number, v: number) => s + v, 0), 0);
        return totalReactions(b) - totalReactions(a);
      }
      if (sortOrder === "difficulty") {
        const avgDiff = (g: any) => g.items.reduce((s: number, r: any) => s + (r.difficulty || 0), 0) / (g.items.length || 1);
        return avgDiff(b) - avgDiff(a);
      }
      // newest: default (already sorted by created_at desc)
      return new Date(b.items[0]?.created_at || 0).getTime() - new Date(a.items[0]?.created_at || 0).getTime();
    });

  const isDetailView = !!(selectedExam || searchQuery);

  // ===== 投稿詳細ページ（早期return） =====
  if (selectedPost) {
    let details: any = {};
    try { if (selectedPost.details) details = JSON.parse(selectedPost.details); } catch {}
    const detailSections = [
      {
        title: "試験概要",
        fields: [
          { label: "受験費用", val: details.examFee },
          { label: "問題数", val: details.questionCount },
          { label: "問題文の長さ", val: details.questionLength },
          { label: "出題形式", val: details.examFormat },
        ]
      },
      {
        title: "勉強について",
        fields: [
          { label: "勉強時間", val: details.studyHours },
          { label: "使用教材", val: details.studyMaterials },
          { label: "効果があった勉強法", val: details.effectiveMethod },
        ]
      },
      {
        title: "試験内容",
        fields: [
          { label: "頻出の内容", val: details.frequentTopics },
          { label: "苦戦したポイント", val: details.challengePoints },
        ]
      },
      {
        title: "合格に向けて",
        fields: [
          { label: "合格へのコツ", val: details.passingTips },
          { label: "これから受ける方へのアドバイス", val: details.adviceForNext },
        ]
      },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="max-w-2xl mx-auto p-6 pb-20">
          {/* 戻るボタン */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
            >
              ← 一覧に戻る
            </button>
            <span className="text-indigo-500/40 text-xs">/</span>
            <span className="text-white/60 text-xs">{selectedPost.exam_name}</span>
            <span className="text-indigo-500/40 text-xs">/</span>
            <span className="text-white text-xs font-bold">{selectedPost.user_name}</span>
          </div>

          {editingId === selectedPost.id && editingFields ? (
            /* ===== 編集フォーム ===== */
            <div className="bg-white/8 border border-indigo-400/30 rounded-2xl p-5 mb-4 shadow-xl space-y-4">
              <p className="text-[10px] font-black text-indigo-300 tracking-widest uppercase">✏️ 投稿を編集</p>

              {/* 投稿者名 */}
              <div>
                <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">投稿者名</label>
                <input
                  className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                  value={editingFields.user_name}
                  onChange={e => setEditingFields(prev => prev ? {...prev, user_name: e.target.value} : prev)}
                />
              </div>

              {/* 一言コメント */}
              <div>
                <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">一言コメント ★</label>
                <textarea
                  className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none"
                  rows={3}
                  value={editingFields.memo}
                  onChange={e => setEditingFields(prev => prev ? {...prev, memo: e.target.value} : prev)}
                />
              </div>

              {/* 難易度 */}
              <div>
                <label className="block text-[10px] text-indigo-400/70 font-bold mb-1.5">難易度</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setEditingFields(prev => prev ? {...prev, difficulty: n} : prev)} className={`text-2xl transition-transform hover:scale-110 ${n <= editingFields.difficulty ? "text-yellow-400" : "text-white/15"}`}>★</button>
                  ))}
                </div>
              </div>

              {/* 試験概要 */}
              <div>
                <p className="text-[9px] text-indigo-500/60 font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                  <span className="h-px bg-indigo-500/30 flex-1"></span>試験概要<span className="h-px bg-indigo-500/30 flex-1"></span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: "examFee", label: "受験費用", placeholder: "例: 7,500円" },
                    { key: "questionCount", label: "問題数", placeholder: "例: 60問" },
                    { key: "questionLength", label: "問題文の長さ", placeholder: "例: 短め・普通・長め" },
                    { key: "examFormat", label: "出題形式", placeholder: "例: 四択・記述式" },
                  ] as const).map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">{label}</label>
                      <input
                        className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                        placeholder={placeholder}
                        value={(editingFields as any)[key]}
                        onChange={e => setEditingFields(prev => prev ? {...prev, [key]: e.target.value} : prev)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 勉強について */}
              <div>
                <p className="text-[9px] text-indigo-500/60 font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                  <span className="h-px bg-indigo-500/30 flex-1"></span>勉強について<span className="h-px bg-indigo-500/30 flex-1"></span>
                </p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: "studyHours", label: "勉強時間", placeholder: "例: 3ヶ月・1日2時間" },
                      { key: "studyMaterials", label: "使用教材", placeholder: "例: 公式テキスト・過去問" },
                    ] as const).map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">{label}</label>
                        <input
                          className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                          placeholder={placeholder}
                          value={(editingFields as any)[key]}
                          onChange={e => setEditingFields(prev => prev ? {...prev, [key]: e.target.value} : prev)}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">効果があった勉強法</label>
                    <textarea
                      className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none h-16"
                      placeholder="例: 過去問を繰り返し解いた"
                      value={editingFields.effectiveMethod}
                      onChange={e => setEditingFields(prev => prev ? {...prev, effectiveMethod: e.target.value} : prev)}
                    />
                  </div>
                </div>
              </div>

              {/* 試験内容 */}
              <div>
                <p className="text-[9px] text-indigo-500/60 font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                  <span className="h-px bg-indigo-500/30 flex-1"></span>試験内容<span className="h-px bg-indigo-500/30 flex-1"></span>
                </p>
                <div className="space-y-2">
                  {([
                    { key: "frequentTopics", label: "頻出の内容", placeholder: "例: ○○分野が多く出題された" },
                    { key: "challengePoints", label: "苦戦したポイント", placeholder: "例: 計算問題が難しかった" },
                  ] as const).map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">{label}</label>
                      <textarea
                        className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none h-16"
                        placeholder={placeholder}
                        value={(editingFields as any)[key]}
                        onChange={e => setEditingFields(prev => prev ? {...prev, [key]: e.target.value} : prev)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 合格に向けて */}
              <div>
                <p className="text-[9px] text-indigo-500/60 font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                  <span className="h-px bg-indigo-500/30 flex-1"></span>合格に向けて<span className="h-px bg-indigo-500/30 flex-1"></span>
                </p>
                <div className="space-y-2">
                  {([
                    { key: "passingTips", label: "合格へのコツ", placeholder: "例: 苦手分野を重点的に対策した" },
                    { key: "adviceForNext", label: "これから受ける方へのアドバイス", placeholder: "例: 早めに申し込みをおすすめします" },
                  ] as const).map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">{label}</label>
                      <textarea
                        className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none h-16"
                        placeholder={placeholder}
                        value={(editingFields as any)[key]}
                        onChange={e => setEditingFields(prev => prev ? {...prev, [key]: e.target.value} : prev)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ボタン */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={async () => {
                    await saveEdit(selectedPost.id);
                    const updatedDetails = JSON.stringify({
                      examFee: editingFields.examFee, questionCount: editingFields.questionCount,
                      questionLength: editingFields.questionLength, examFormat: editingFields.examFormat,
                      studyMaterials: editingFields.studyMaterials, studyHours: editingFields.studyHours,
                      effectiveMethod: editingFields.effectiveMethod, frequentTopics: editingFields.frequentTopics,
                      challengePoints: editingFields.challengePoints, passingTips: editingFields.passingTips,
                      adviceForNext: editingFields.adviceForNext,
                    });
                    setSelectedPost((prev: any) => ({
                      ...prev,
                      user_name: editingFields.user_name,
                      memo: editingFields.memo,
                      difficulty: editingFields.difficulty,
                      details: updatedDetails,
                    }));
                  }}
                  className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
                >保存</button>
                <button
                  onClick={() => { setEditingId(null); setEditingFields(null); }}
                  className="bg-white/10 text-white/70 px-5 py-2 rounded-xl text-sm font-bold hover:bg-white/20 transition-all"
                >キャンセル</button>
              </div>
            </div>
          ) : (
            <>
              {/* ヘッダー */}
              <div className="bg-white/8 border border-white/15 rounded-2xl p-6 mb-4 shadow-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[9px] text-indigo-400/50 font-bold tracking-widest uppercase mb-1">投稿者</p>
                    <p className="text-white font-black text-lg">{selectedPost.user_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-indigo-400/50 font-bold tracking-widest uppercase mb-1">投稿日時</p>
                    <p className="text-indigo-300/70 text-xs">{formatDateTime(selectedPost.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full text-xs font-bold">📋 {selectedPost.exam_name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-indigo-400/50 uppercase tracking-widest">難易度</span>
                    <span className="text-yellow-400 text-sm">{"★".repeat(selectedPost.difficulty)}<span className="text-white/15">{"★".repeat(5 - selectedPost.difficulty)}</span></span>
                  </div>
                </div>
              </div>

              {/* 一言コメント */}
              <div className="bg-white/8 border border-indigo-400/20 rounded-2xl p-5 mb-4 shadow-xl">
                <p className="text-[9px] text-indigo-400/60 font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
                  <span className="h-px bg-indigo-500/30 flex-1"></span>一言コメント<span className="h-px bg-indigo-500/30 flex-1"></span>
                </p>
                <p className="text-indigo-100/90 text-sm leading-relaxed whitespace-pre-wrap">{selectedPost.memo}</p>
              </div>

              {/* 詳細セクション */}
              {detailSections.map(section => {
                const visible = section.fields.filter(f => f.val);
                if (visible.length === 0) return null;
                return (
                  <div key={section.title} className="bg-white/8 border border-white/15 rounded-2xl p-5 mb-4 shadow-xl">
                    <p className="text-[9px] text-indigo-400/60 font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
                      <span className="h-px bg-indigo-500/30 flex-1"></span>{section.title}<span className="h-px bg-indigo-500/30 flex-1"></span>
                    </p>
                    <div className="space-y-3">
                      {visible.map(({ label, val }) => (
                        <div key={label} className="bg-white/5 border border-white/8 rounded-xl p-3">
                          <p className="text-[9px] text-indigo-400/60 font-bold tracking-widest uppercase mb-1.5">{label}</p>
                          <p className="text-sm text-indigo-100/85 leading-relaxed whitespace-pre-wrap">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* リアクション */}
          <div className="bg-white/8 border border-white/15 rounded-2xl p-5 mb-4 shadow-xl">
            <p className="text-[9px] text-indigo-400/60 font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
              <span className="h-px bg-indigo-500/30 flex-1"></span>リアクション<span className="h-px bg-indigo-500/30 flex-1"></span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {REACTION_OPTIONS.map(emoji => (
                <button key={emoji} onClick={async () => { await handleReaction(selectedPost.id, emoji); const updated = records.find(r => r.id === selectedPost.id); if (updated) setSelectedPost(updated); }} className="text-sm bg-white/5 border border-white/10 rounded-full px-3 py-1 hover:bg-indigo-500/20 hover:border-indigo-400/40 active:scale-125 transition-all">
                  {emoji} <span className="font-bold text-indigo-300/70">{selectedPost.reactions?.[emoji] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* コメント */}
          <div className="bg-white/8 border border-white/15 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-white/10 bg-indigo-950/40">
              <p className="text-xs font-bold text-indigo-300 tracking-widest uppercase">💬 返信 ({selectedPost.comments?.length || 0})</p>
            </div>
            <div className="p-5 space-y-4">
              {(selectedPost.comments || []).length === 0 ? (
                <p className="text-xs text-indigo-500/50 italic text-center py-4">まだ返信はありません</p>
              ) : (
                selectedPost.comments.map((c: any) => (
                  <div key={c.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-indigo-300">{c.user_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-indigo-500/50">{formatDateTime(c.created_at)}</span>
                        {(isAdmin || selectedPost.user_id === session?.user?.id) && editingCommentId !== c.id && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.text); }}
                              className="text-[9px] text-indigo-400/60 hover:text-indigo-300 bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded transition-all"
                            >編集</button>
                            <button
                              onClick={() => deleteComment(selectedPost, c.id, setSelectedPost)}
                              className="text-[9px] text-red-400/60 hover:text-red-300 bg-white/5 hover:bg-red-500/10 px-1.5 py-0.5 rounded transition-all"
                            >削除</button>
                          </div>
                        )}
                      </div>
                    </div>
                    {editingCommentId === c.id ? (
                      <div className="space-y-1.5">
                        <textarea
                          className="w-full bg-white/8 border border-indigo-400/40 p-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                          rows={3}
                          value={editingCommentText}
                          onChange={e => setEditingCommentText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveCommentEdit(selectedPost, c.id, editingCommentText, setSelectedPost)} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-500 transition-all">保存</button>
                          <button onClick={() => setEditingCommentId(null)} className="bg-white/10 text-white/60 px-3 py-1 rounded-lg text-xs font-bold hover:bg-white/20 transition-all">キャンセル</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-indigo-100/80 leading-relaxed bg-white/5 border border-white/10 p-3 rounded-xl">
                        {c.text.startsWith('@') ? (
                          <><span className="text-indigo-400 font-bold">{c.text.split(' ')[0]}</span>{c.text.substring(c.text.split(' ')[0].length)}</>
                        ) : c.text}
                      </p>
                    )}
                  </div>
                ))
              )}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <input
                  className="bg-white/8 border border-white/15 p-2.5 w-full rounded-xl text-xs text-white placeholder-indigo-400/50 outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                  placeholder="お名前"
                  value={commentName}
                  onChange={e => setCommentName(e.target.value)}
                />
                <div className="flex gap-2 items-end">
                  <textarea
                    className="bg-white/8 border border-white/15 p-3 flex-1 rounded-xl text-sm text-white placeholder-indigo-400/50 h-20 outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none"
                    placeholder="返信内容を入力してください..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <button
                    onClick={async () => {
                      if (!commentName || !commentText) { alert("名前とコメント内容を入力してください"); return; }
                      const newComment = { id: Date.now(), user_name: commentName, text: commentText, created_at: new Date().toISOString() };
                      const updatedComments = [...(selectedPost.comments || []), newComment];
                      const { error } = await supabase.from("shikaku_memos").update({ comments: updatedComments }).eq("id", selectedPost.id);
                      if (error) { alert("保存に失敗しました: " + error.message); return; }
                      setCommentText("");
                      setSelectedPost((prev: any) => ({ ...prev, comments: updatedComments }));
                      setRecords((prev: any[]) => prev.map(r => r.id === selectedPost.id ? { ...r, comments: updatedComments } : r));
                    }}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:from-blue-400 hover:to-indigo-500 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                  >送信</button>
                </div>
              </div>
            </div>
          </div>

          {/* ブックマーク＋管理ボタン */}
          <div className="flex gap-2 mt-4 justify-between items-center">
            {session && (
              <button
                onClick={() => toggleBookmark(selectedPost.id)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${bookmarks.includes(selectedPost.id) ? "bg-amber-500/20 border-amber-400/40 text-amber-300" : "bg-white/5 border-white/10 text-indigo-400 hover:bg-white/10"}`}
              >
                🔖 {bookmarks.includes(selectedPost.id) ? "保存済み" : "ブックマーク"}
              </button>
            )}
            {(isAdmin || selectedPost.user_id === session?.user?.id) && (
              <div className="flex gap-2 ml-auto">
                <button onClick={() => {
                  let d: any = {};
                  try { if (selectedPost.details) d = JSON.parse(selectedPost.details); } catch {}
                  setEditingId(selectedPost.id);
                  setEditingFields({
                    user_name: selectedPost.user_name || "",
                    memo: selectedPost.memo || "",
                    difficulty: selectedPost.difficulty || 3,
                    examFee: d.examFee || "",
                    questionCount: d.questionCount || "",
                    questionLength: d.questionLength || "",
                    examFormat: d.examFormat || "",
                    studyHours: d.studyHours || "",
                    studyMaterials: d.studyMaterials || "",
                    effectiveMethod: d.effectiveMethod || "",
                    frequentTopics: d.frequentTopics || "",
                    challengePoints: d.challengePoints || "",
                    passingTips: d.passingTips || "",
                    adviceForNext: d.adviceForNext || "",
                  });
                }} className="text-xs font-bold text-indigo-400 hover:text-indigo-200 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all">編集</button>
                <button onClick={async () => { if (!confirm("投稿を削除しますか？")) return; await supabase.from("shikaku_memos").delete().eq("id", selectedPost.id); setSelectedPost(null); fetchRecords(); }} className="text-xs font-bold text-red-400 hover:text-red-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">削除</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative">
      {/* 背景グロー */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* ===== サイドメニュー ===== */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="relative w-72 h-full bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl z-10">
            <div className="p-6 border-b border-white/10">
              <img src="/widsley1.png" alt="Widsley" className="h-8 w-auto object-contain drop-shadow mb-4" />
              <p className="text-[10px] text-indigo-400/60 tracking-[0.2em] uppercase">資格試験メモ共有プラットフォーム</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              <button
                onClick={goHome}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-100 hover:bg-white/8 transition-all text-sm font-bold"
              >
                <span className="text-lg">🏠</span> ホーム
              </button>
              <button
                onClick={() => { setSearchOpen(true); setMenuOpen(false); setTimeout(() => document.getElementById("search-input")?.focus(), 100); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-100 hover:bg-white/8 transition-all text-sm font-bold"
              >
                <span className="text-lg">🔍</span> 検索
              </button>
              <button
                onClick={() => { setMenuOpen(false); document.getElementById("post-form")?.scrollIntoView({ behavior: "smooth" }); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-100 hover:bg-white/8 transition-all text-sm font-bold"
              >
                <span className="text-lg">✏️</span> 新規投稿
              </button>
              <a
                href="/mypage"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 text-emerald-200 hover:from-emerald-600/30 hover:to-teal-600/30 transition-all text-sm font-bold"
              >
                <span className="text-lg">🎖</span> マイページ
              </a>
              <a
                href="/quiz"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 text-violet-200 hover:from-violet-600/30 hover:to-indigo-600/30 transition-all text-sm font-bold"
              >
                <span className="text-lg">🎯</span> 資格診断
              </a>
              <div className="pt-4">
                <p className="text-[9px] text-indigo-500/50 tracking-widest uppercase px-4 mb-2">資格を追加</p>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      className="bg-white/8 border border-white/15 flex-1 px-3 py-2 rounded-xl text-white placeholder-indigo-400/50 text-xs outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                      placeholder="資格名を入力..."
                      value={addExamInput}
                      onChange={e => { setAddExamInput(e.target.value); setShowAddDropdown(true); }}
                      onFocus={() => setShowAddDropdown(true)}
                      onBlur={() => setTimeout(() => setShowAddDropdown(false), 150)}
                      onKeyDown={e => { if (e.key === "Enter") { handleAddExam(addExamInput); setAddExamInput(""); setShowAddDropdown(false); } }}
                    />
                    <button
                      onClick={() => { handleAddExam(addExamInput); setAddExamInput(""); setShowAddDropdown(false); }}
                      className="bg-indigo-600 text-white px-3 rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all"
                    >追加</button>
                  </div>
                  {showAddDropdown && filteredAddQuals.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-slate-800 border border-white/15 rounded-xl shadow-2xl">
                      {filteredAddQuals.slice(0, 15).map((name) => (
                        <button
                          key={name}
                          onMouseDown={() => { setAddExamInput(name); setShowAddDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors flex items-center justify-between"
                        >
                          <span className="text-indigo-100/85 font-semibold truncate">{name}</span>
                          <span className="text-indigo-400/60 text-[10px] shrink-0 ml-2">+{getXpForExam(name)} XP</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-3">
                <p className="text-[9px] text-indigo-500/50 tracking-widest uppercase px-4 mb-2">Stats</p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-indigo-400">総投稿数</span>
                    <span className="text-sm font-black text-white">{records.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-indigo-400">資格数</span>
                    <span className="text-sm font-black text-white">{examMaster.length}</span>
                  </div>
                </div>
              </div>
            </nav>
            <div className="p-4 border-t border-white/10">
              {session?.user && (
                <p className="text-[10px] text-indigo-400/50 px-4 pb-2 truncate">{session.user.email}</p>
              )}
              <button
                onClick={() => { setMenuOpen(false); supabase.auth.signOut(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold"
              >
                <span className="text-lg">🚪</span> ログアウト
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-4xl mx-auto p-6 pb-20">

        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(true)}
              className="flex flex-col justify-center gap-1.5 w-10 h-10 items-center bg-white/8 border border-white/15 rounded-xl hover:bg-white/15 transition-all"
            >
              <span className="w-5 h-0.5 bg-white rounded-full"></span>
              <span className="w-5 h-0.5 bg-white rounded-full"></span>
              <span className="w-3 h-0.5 bg-white rounded-full self-start ml-2.5"></span>
            </button>
            <button onClick={goHome} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/widsley1.png" alt="Widsley" className="h-8 w-auto object-contain drop-shadow" />
              <div>
                <h1 className="text-lg font-black tracking-tight leading-none bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(251,146,60,0.8)] animate-pulse">デップMAX3150</h1>
                <p className="text-orange-400/70 text-[10px] tracking-widest uppercase">2026</p>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/mypage"
              onClick={markNotifsRead}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all text-white font-black text-sm"
              title="マイページ"
            >
              {session?.user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
               session?.user?.email?.[0]?.toUpperCase() || "👤"}
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-lg">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </a>
            <button
              onClick={() => setSearchOpen(v => !v)}
              className={classNames(
                "w-10 h-10 flex items-center justify-center rounded-xl border transition-all text-lg",
                searchOpen ? "bg-indigo-500/30 border-indigo-400/50 text-indigo-200" : "bg-white/8 border-white/15 text-indigo-300 hover:bg-white/15"
              )}
            >🔍</button>
          </div>
        </div>

        {/* 検索バー */}
        {searchOpen && (
          <div className="mb-6">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 text-sm">🔍</span>
              <input
                id="search-input"
                type="text"
                className="w-full bg-white/8 border border-indigo-400/40 rounded-xl pl-10 pr-10 py-3 text-white placeholder-indigo-400/50 text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                placeholder="資格名・感想で検索..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white transition-colors text-lg leading-none">&times;</button>
              )}
            </div>
            {searchQuery && (
              <p className="text-[10px] text-indigo-400/60 mt-2 pl-1">
                「{searchQuery}」の検索結果: <span className="text-indigo-300 font-bold">{filteredGroups.reduce((acc, g) => acc + g.items.length, 0)} 件</span>
              </p>
            )}
          </div>
        )}

        {/* ===== ホーム：資格カードグリッド ===== */}
        {!isDetailView ? (
          <div>
            {/* 資格診断バナー */}
            <a
              href="/quiz"
              className="flex items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-gradient-to-r from-violet-600/25 to-indigo-600/20 border border-violet-500/35 hover:from-violet-600/35 hover:to-indigo-600/30 transition-all group shadow-lg shadow-violet-500/10"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <div>
                  <p className="text-white font-black text-sm leading-tight">どの資格から始める？</p>
                  <p className="text-violet-300/70 text-xs mt-0.5">7問に答えてあなたにぴったりの資格を診断！</p>
                </div>
              </div>
              <span className="text-violet-300 font-black text-sm group-hover:translate-x-1 transition-transform whitespace-nowrap">診断する →</span>
            </a>

            {/* ===== 取得速報フィード ===== */}
            {celebFeed.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-[10px] font-bold text-amber-400/70 tracking-[0.3em] uppercase">📡 速報</p>
                  <span className="h-px bg-amber-500/20 flex-1"></span>
                  <button
                    onClick={() => celebScrollRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/8 border border-white/15 text-indigo-300 hover:bg-white/15 transition-all text-xs"
                  >←</button>
                  <button
                    onClick={() => celebScrollRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/8 border border-white/15 text-indigo-300 hover:bg-white/15 transition-all text-xs"
                  >→</button>
                </div>
                <div ref={celebScrollRef} className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {celebFeed.map((item: any) => {
                    const profile = item.user_profiles as any;
                    const CELEB_EMOJIS = ["🎉", "👏", "🔥", "💪", "⭐"];
                    const isQual = item._type === "qual";
                    return (
                      <div key={item._feedId} className={`shrink-0 w-56 border rounded-2xl p-4 shadow-lg ${isQual ? "bg-gradient-to-br from-amber-600/20 to-orange-600/15 border-amber-500/25" : "bg-gradient-to-br from-indigo-600/20 to-violet-600/15 border-indigo-500/25"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{isQual ? (profile?.avatar || "👤") : "✏️"}</span>
                          <div className="min-w-0">
                            <p className={`text-[10px] font-black truncate ${isQual ? "text-amber-300/80" : "text-indigo-300/80"}`}>
                              {isQual ? (profile?.display_name || "Unknown") : item.user_name}
                            </p>
                            <p className={`text-[9px] ${isQual ? "text-amber-400/50" : "text-indigo-400/50"}`}>
                              {new Date(item.created_at).toLocaleDateString("ja-JP")}
                            </p>
                          </div>
                          <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isQual ? "bg-amber-500/20 text-amber-300" : "bg-indigo-500/20 text-indigo-300"}`}>
                            {isQual ? "取得" : "投稿"}
                          </span>
                        </div>
                        <p className="text-xs font-black text-white leading-tight mb-1 line-clamp-2">{item.exam_name}</p>
                        {isQual
                          ? <p className="text-[10px] text-emerald-400 font-bold mb-3">+{item.xp_earned} XP 取得！🎊</p>
                          : <p className="text-[10px] text-indigo-300/60 mb-3">{item.result ? `結果: ${item.result}` : ""} {"★".repeat(item.difficulty || 0)}</p>
                        }
                        <div className="flex gap-1 flex-wrap">
                          {CELEB_EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleCelebReaction(item._feedId, emoji)}
                              className="text-xs bg-white/8 hover:bg-white/15 border border-white/10 rounded-full px-2 py-0.5 transition-all active:scale-110"
                            >
                              {emoji}<span className="text-[9px] text-white/50 ml-0.5">{item.reactions?.[emoji] || 0}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* セクションタイトル + 資格追加 */}
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[10px] font-bold text-indigo-400/60 tracking-[0.3em] uppercase">資格一覧</p>
              <span className="h-px bg-indigo-500/20 flex-1"></span>
              <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest">
                {sortedGroupedRecords.length} 資格
              </span>
            </div>
            {/* フィルター＋ソートバー */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setShowBookmarksOnly(false)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${!showBookmarksOnly ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/40" : "bg-white/5 text-indigo-400/60 border border-white/10 hover:bg-white/10"}`}
              >すべて</button>
              <button
                onClick={() => setShowBookmarksOnly(true)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${showBookmarksOnly ? "bg-amber-500/30 text-amber-200 border border-amber-400/40" : "bg-white/5 text-indigo-400/60 border border-white/10 hover:bg-white/10"}`}
              >🔖 保存済み</button>
              <span className="h-4 w-px bg-white/15 mx-1"></span>
              {(["newest", "popular", "difficulty"] as const).map(order => (
                <button
                  key={order}
                  onClick={() => setSortOrder(order)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${sortOrder === order ? "bg-white/15 text-white border border-white/25" : "bg-white/5 text-indigo-400/60 border border-white/10 hover:bg-white/10"}`}
                >
                  {order === "newest" ? "🕐 新着順" : order === "popular" ? "👍 人気順" : "★ 難易度順"}
                </button>
              ))}
            </div>
            <div className="relative mb-6">
              <div className="flex gap-2">
                <input
                  className="bg-white/8 border border-white/15 flex-1 px-4 py-2.5 rounded-xl text-white placeholder-indigo-400/50 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                  placeholder="新しい資格名を入力して追加..."
                  value={addExamInput}
                  onChange={e => { setAddExamInput(e.target.value); setShowAddDropdown(true); }}
                  onFocus={() => setShowAddDropdown(true)}
                  onBlur={() => setTimeout(() => setShowAddDropdown(false), 150)}
                  onKeyDown={e => { if (e.key === "Enter") { handleAddExam(addExamInput); setAddExamInput(""); setShowAddDropdown(false); } }}
                />
                <button
                  onClick={() => { handleAddExam(addExamInput); setAddExamInput(""); setShowAddDropdown(false); }}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 rounded-xl text-sm font-bold hover:from-indigo-500 hover:to-blue-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 whitespace-nowrap"
                >+ 追加</button>
              </div>
              {showAddDropdown && filteredAddQuals.length > 0 && (
                <div className="absolute z-50 w-full mt-1 max-h-52 overflow-y-auto bg-slate-800 border border-white/15 rounded-xl shadow-2xl">
                  {filteredAddQuals.slice(0, 15).map((name) => (
                    <button
                      key={name}
                      onMouseDown={() => { setAddExamInput(name); setShowAddDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center justify-between"
                    >
                      <span className="text-indigo-100/85 font-semibold">{name}</span>
                      <span className="text-indigo-400/60 text-xs shrink-0 ml-2">+{getXpForExam(name)} XP</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {sortedGroupedRecords.length === 0 ? (
              <div className="text-center py-24 text-indigo-400/40">
                <p className="text-4xl mb-4">📭</p>
                <p className="text-sm font-bold">まだ投稿がありません</p>
                <p className="text-xs mt-1">最初の資格情報を共有しましょう</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedGroupedRecords.map((group, i) => {
                  const avgDiff = group.items.length > 0
                    ? Math.round(group.items.reduce((s: number, r: any) => s + (r.difficulty || 0), 0) / group.items.length)
                    : 0;
                  const latestDate = group.items[0]?.created_at;
                  const grad = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
                  const isEditing = editingExam === group.name;
                  return (
                    <div
                      key={group.name}
                      className={`bg-gradient-to-br ${grad} backdrop-blur-xl border border-white/12 rounded-2xl p-6 text-left transition-all duration-200 shadow-xl group relative ${!isEditing ? "hover:border-indigo-400/40 hover:scale-[1.02] cursor-pointer" : "border-indigo-400/40"}`}
                      onClick={() => { if (!isEditing) setSelectedExam(group.name); }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xl shadow-inner">
                          📋
                        </div>
                        <div className="flex items-center gap-2">
                          {/* 編集・削除ボタン（ホバーで表示） */}
                          {isAdmin && <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => { setEditingExam(group.name); setEditingExamName(group.name); }}
                              className="text-[10px] font-bold text-indigo-300/60 hover:text-indigo-200 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-all"
                            >編集</button>
                            <button
                              onClick={() => deleteExam(group.name)}
                              className="text-[10px] font-bold text-red-400/60 hover:text-red-300 bg-white/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-all"
                            >削除</button>
                          </div>}
                          <span className="bg-black/20 border border-white/10 text-indigo-200 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                            {group.items.length} Posts
                          </span>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="mb-1" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            className="bg-white/15 border border-indigo-400/60 rounded-xl px-3 py-1.5 text-white font-black text-base w-full outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                            value={editingExamName}
                            onChange={e => setEditingExamName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") renameExam(group.name, editingExamName);
                              if (e.key === "Escape") setEditingExam(null);
                            }}
                          />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => renameExam(group.name, editingExamName)} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-500 transition-all">保存</button>
                            <button onClick={() => setEditingExam(null)} className="bg-white/15 text-white/70 px-3 py-1 rounded-lg text-xs font-bold hover:bg-white/20 transition-all">キャンセル</button>
                          </div>
                        </div>
                      ) : (
                        <h3 className="text-white font-black text-base leading-tight mb-1 group-hover:text-indigo-100 transition-colors">
                          {group.name}
                        </h3>
                      )}

                      {avgDiff > 0 && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="text-[9px] text-indigo-300/50 uppercase tracking-widest">難易度</span>
                          <span className="text-yellow-400 text-xs">{"★".repeat(avgDiff)}<span className="text-white/15">{"★".repeat(5 - avgDiff)}</span></span>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between">
                          {latestDate ? (
                            <span className="text-[9px] text-indigo-400/40">
                              最終更新: {new Date(latestDate).toLocaleDateString()}
                            </span>
                          ) : <span />}
                          <span className="text-indigo-400/50 group-hover:text-indigo-300 transition-colors text-sm">→</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ===== 詳細ビュー ===== */
          <div>
            {/* パンくず・戻るボタン */}
            {selectedExam && (
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => { setSelectedExam(null); setSearchQuery(""); setSearchOpen(false); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                >
                  ← ホームに戻る
                </button>
                <span className="text-indigo-500/40 text-xs">/</span>
                <span className="text-white font-bold text-sm">{selectedExam}</span>
                <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest ml-auto">
                  {filteredGroups[0]?.items.length ?? 0} Posts
                </span>
              </div>
            )}

            {/* 投稿フォーム */}
            <div id="post-form" className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl mb-8 shadow-xl overflow-hidden">
              <button
                onClick={() => setPostFormOpen(v => !v)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-all"
              >
                <h2 className="text-[10px] font-bold text-indigo-300 tracking-[0.2em] uppercase">✏️ New Post</h2>
                <span className={`text-indigo-400 text-xs transition-transform duration-200 ${postFormOpen ? "rotate-180" : ""}`}>▼</span>
              </button>

              {postFormOpen && (
              <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex gap-2">
                  {(["myname", "anonymous"] as const).map(mode => (
                    <button key={mode} type="button" onClick={() => setNameMode(mode)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${nameMode === mode ? "bg-indigo-500/30 border-indigo-400/50 text-white" : "bg-white/5 border-white/10 text-indigo-400/60 hover:border-white/20"}`}>
                      {mode === "myname" ? `👤 ${userName || "MyName"}` : "🕶 匿名"}
                    </button>
                  ))}
                </div>
                <select
                  className="bg-slate-800 border border-white/15 p-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  value={examName || selectedExam || ""}
                  onChange={e => setExamName(e.target.value)}
                >
                  <option value="">資格を選択 ★</option>
                  {examMaster.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>

              <div className="space-y-5">

                <div>
                  <label className="block text-[10px] text-indigo-400 font-bold tracking-widest uppercase mb-1.5">一言コメント ★</label>
                  <textarea
                    className="bg-white/8 border border-white/15 p-3 w-full h-20 rounded-xl text-white placeholder-indigo-400/50 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none"
                    placeholder="合格した感想を一言で..."
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-indigo-400 font-bold tracking-widest uppercase mb-1.5">難易度</label>
                  <div className="flex gap-1 items-center">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setDifficulty(n)} className={`text-2xl transition-transform hover:scale-110 ${n <= difficulty ? "text-yellow-400" : "text-white/15"}`}>★</button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-indigo-500/60 font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                    <span className="h-px bg-indigo-500/30 flex-1"></span>試験概要<span className="h-px bg-indigo-500/30 flex-1"></span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "受験費用", placeholder: "例: 7,500円", val: examFee, set: setExamFee },
                      { label: "問題数", placeholder: "例: 60問", val: questionCount, set: setQuestionCount },
                      { label: "問題文の長さ", placeholder: "例: 短め・普通・長め", val: questionLength, set: setQuestionLength },
                      { label: "出題形式", placeholder: "例: 四択・記述式", val: examFormat, set: setExamFormat },
                    ].map(({ label, placeholder, val, set }) => (
                      <div key={label}>
                        <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">{label}</label>
                        <input
                          className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                          placeholder={placeholder}
                          value={val}
                          onChange={e => set(e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-indigo-500/60 font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                    <span className="h-px bg-indigo-500/30 flex-1"></span>勉強について<span className="h-px bg-indigo-500/30 flex-1"></span>
                  </p>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">勉強時間</label>
                        <input className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all" placeholder="例: 3ヶ月・1日2時間" value={studyHours} onChange={e => setStudyHours(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">使用教材</label>
                        <input className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all" placeholder="例: 公式テキスト・過去問" value={studyMaterials} onChange={e => setStudyMaterials(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">効果があった勉強法</label>
                      <textarea className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none h-16" placeholder="例: 過去問を繰り返し解いた" value={effectiveMethod} onChange={e => setEffectiveMethod(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-indigo-500/60 font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                    <span className="h-px bg-indigo-500/30 flex-1"></span>試験内容<span className="h-px bg-indigo-500/30 flex-1"></span>
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "頻出の内容", placeholder: "例: ○○分野が多く出題された", val: frequentTopics, set: setFrequentTopics },
                      { label: "苦戦したポイント", placeholder: "例: 計算問題が難しかった", val: challengePoints, set: setChallengePoints },
                    ].map(({ label, placeholder, val, set }) => (
                      <div key={label}>
                        <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">{label}</label>
                        <textarea className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none h-16" placeholder={placeholder} value={val} onChange={e => set(e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-indigo-500/60 font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                    <span className="h-px bg-indigo-500/30 flex-1"></span>合格に向けて<span className="h-px bg-indigo-500/30 flex-1"></span>
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "合格へのコツ", placeholder: "例: 苦手分野を重点的に対策した", val: passingTips, set: setPassingTips },
                      { label: "これから受ける方へのアドバイス", placeholder: "例: 早めに申し込みをおすすめします", val: adviceForNext, set: setAdviceForNext },
                    ].map(({ label, placeholder, val, set }) => (
                      <div key={label}>
                        <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">{label}</label>
                        <textarea className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none h-16" placeholder={placeholder} value={val} onChange={e => set(e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <button
                onClick={saveRecord}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-xl font-bold mt-4 text-sm hover:from-blue-400 hover:to-indigo-500 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
              >投稿を保存</button>
              </div>
              )}
            </div>

            {/* 一覧表示（見出しカード） */}
            <div className="space-y-5">
              {filteredGroups.length === 0 && (
                <div className="text-center py-16 text-indigo-400/40">
                  <p className="text-3xl mb-3">📭</p>
                  <p className="text-sm">投稿が見つかりません</p>
                </div>
              )}
              {filteredGroups.map(group => (
                <div key={group.name} className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-xl">
                  {searchQuery && (
                    <div className="px-5 py-3 flex justify-between items-center border-b border-white/10 bg-indigo-950/40">
                      <span className="text-sm font-bold text-indigo-200">📁 {group.name}</span>
                      <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase">{group.items.length} Posts</span>
                    </div>
                  )}
                  <div className="p-3 space-y-2">
                    {group.items.map(r => (
                      <div key={r.id} className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/40 rounded-xl transition-all group">
                        <button
                          onClick={() => setSelectedPost(r)}
                          className="flex-1 text-left px-4 py-3"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-white text-sm shrink-0">{r.user_name}</span>
                              <span className="text-yellow-400 text-xs shrink-0">{"★".repeat(r.difficulty)}</span>
                              <span className="text-indigo-100/60 text-sm truncate">{r.memo}</span>
                            </div>
                            <div className="flex items-center gap-3 ml-3 shrink-0">
                              <span className="text-[10px] text-indigo-400/50">{formatDateTime(r.created_at)}</span>
                              <span className="text-indigo-400/50 group-hover:text-indigo-300 transition-colors text-sm">→</span>
                            </div>
                          </div>
                        </button>
                        {session && (
                          <button
                            onClick={() => toggleBookmark(r.id)}
                            className={`px-2 py-1 text-base transition-all hover:scale-110 shrink-0 ${bookmarks.includes(r.id) ? "text-amber-400" : "text-white/20 hover:text-amber-400/60"}`}
                            title={bookmarks.includes(r.id) ? "ブックマーク解除" : "ブックマーク"}
                          >🔖</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* コメント・詳細モーダル */}
      <Dialog open={!!selectedRecord} onClose={() => setSelectedRecord(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-indigo-950/50">
              <div>
                <Dialog.Title className="text-sm font-bold text-white tracking-wide">スレッド形式の返信</Dialog.Title>
                {selectedRecord?.exam_name && (
                  <p className="text-[10px] text-indigo-400/70 mt-0.5 tracking-wide">📋 {selectedRecord.exam_name}</p>
                )}
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-indigo-400 hover:text-white text-2xl transition-colors leading-none">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="border-l-4 border-indigo-500 pl-4 py-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">{selectedRecord?.user_name}</p>
                  <span className="text-[9px] text-indigo-500/50">{selectedRecord && formatDateTime(selectedRecord.created_at)}</span>
                </div>
                <p className="text-indigo-100/90 text-sm leading-relaxed">{selectedRecord?.memo}</p>

                {(() => {
                  if (!selectedRecord?.details) return null;
                  let d: any = {};
                  try { d = JSON.parse(selectedRecord.details); } catch { return null; }
                  const rows = [
                    { label: "受験費用", val: d.examFee },
                    { label: "問題数", val: d.questionCount },
                    { label: "問題文の長さ", val: d.questionLength },
                    { label: "出題形式", val: d.examFormat },
                    { label: "勉強時間", val: d.studyHours },
                    { label: "使用教材", val: d.studyMaterials },
                    { label: "効果があった勉強法", val: d.effectiveMethod },
                    { label: "頻出の内容", val: d.frequentTopics },
                    { label: "苦戦したポイント", val: d.challengePoints },
                    { label: "合格へのコツ", val: d.passingTips },
                    { label: "これから受ける方へのアドバイス", val: d.adviceForNext },
                  ].filter(r => r.val);
                  if (rows.length === 0) return null;
                  return (
                    <div className="mt-4 bg-indigo-950/70 border border-indigo-500/20 rounded-2xl p-4 space-y-2">
                      <p className="text-[9px] text-indigo-400/60 font-bold tracking-[0.2em] uppercase flex items-center gap-2 mb-3">
                        <span className="h-px bg-indigo-500/30 flex-1"></span>詳細情報<span className="h-px bg-indigo-500/30 flex-1"></span>
                      </p>
                      {rows.map(({ label, val }) => (
                        <div key={label} className="bg-white/5 border border-white/8 rounded-xl p-3">
                          <p className="text-[9px] text-indigo-400/60 font-bold tracking-widest uppercase mb-1">{label}</p>
                          <p className="text-xs text-indigo-100/80 leading-relaxed whitespace-pre-wrap">{val}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <h4 className="text-[10px] font-bold text-indigo-500/60 tracking-widest uppercase">Replies</h4>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>
                {(selectedRecord?.comments || []).length === 0 ? (
                  <p className="text-xs text-indigo-500/50 italic text-center py-4">まだ返信はありません</p>
                ) : (
                  selectedRecord.comments.map((c: any) => (
                    <div key={c.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-indigo-300">{c.user_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-indigo-500/50">{formatDateTime(c.created_at)}</span>
                          {(isAdmin || selectedRecord.user_id === session?.user?.id) && editingCommentId !== c.id && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.text); }}
                                className="text-[9px] text-indigo-400/60 hover:text-indigo-300 bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded transition-all"
                              >編集</button>
                              <button
                                onClick={() => deleteComment(selectedRecord, c.id, setSelectedRecord)}
                                className="text-[9px] text-red-400/60 hover:text-red-300 bg-white/5 hover:bg-red-500/10 px-1.5 py-0.5 rounded transition-all"
                              >削除</button>
                            </div>
                          )}
                        </div>
                      </div>
                      {editingCommentId === c.id ? (
                        <div className="space-y-1.5">
                          <textarea
                            className="w-full bg-white/8 border border-indigo-400/40 p-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                            rows={3}
                            value={editingCommentText}
                            onChange={e => setEditingCommentText(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => saveCommentEdit(selectedRecord, c.id, editingCommentText, setSelectedRecord)} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-500 transition-all">保存</button>
                            <button onClick={() => setEditingCommentId(null)} className="bg-white/10 text-white/60 px-3 py-1 rounded-lg text-xs font-bold hover:bg-white/20 transition-all">キャンセル</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-indigo-100/80 leading-relaxed bg-white/5 border border-white/10 p-3 rounded-xl">
                          {c.text.startsWith('@') ? (
                            <>
                              <span className="text-indigo-400 font-bold">{c.text.split(' ')[0]}</span>
                              {c.text.substring(c.text.split(' ')[0].length)}
                            </>
                          ) : c.text}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-5 border-t border-white/10 bg-indigo-950/40">
              <div className="flex gap-2 mb-2">
                <input
                  className="bg-white/8 border border-white/15 p-2 flex-1 rounded-xl text-xs text-white placeholder-indigo-400/50 outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                  placeholder="お名前"
                  value={commentName}
                  onChange={e => setCommentName(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-end">
                <textarea
                  className="bg-white/8 border border-white/15 p-3 flex-1 rounded-xl text-sm text-white placeholder-indigo-400/50 h-20 outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none"
                  placeholder="返信内容を入力してください..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
                <button
                  onClick={addComment}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:from-blue-400 hover:to-indigo-500 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                >送信</button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
