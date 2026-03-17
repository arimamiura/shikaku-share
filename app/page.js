"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const react_1 = require("react");
const react_2 = require("@headlessui/react");
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const SHARED_PASSWORD = "shikaku2026";
function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}
const REACTION_OPTIONS = ["👍", "🙌", "💡", "🔥", "🎉"];
function Page() {
    const [password, setPassword] = (0, react_1.useState)("");
    const [isLoggedIn, setIsLoggedIn] = (0, react_1.useState)(false);
    const [menuOpen, setMenuOpen] = (0, react_1.useState)(false);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [searchOpen, setSearchOpen] = (0, react_1.useState)(false);
    /* =====================
        データ管理
    ===================== */
    const [records, setRecords] = (0, react_1.useState)([]);
    const [examMaster, setExamMaster] = (0, react_1.useState)([]);
    const [editingId, setEditingId] = (0, react_1.useState)(null);
    const [editingMemo, setEditingMemo] = (0, react_1.useState)("");
    // コメント用
    const [selectedRecord, setSelectedRecord] = (0, react_1.useState)(null);
    const [commentName, setCommentName] = (0, react_1.useState)("");
    const [commentText, setCommentText] = (0, react_1.useState)("");
    /* =====================
        入力用
    ===================== */
    const [userName, setUserName] = (0, react_1.useState)("");
    const [examName, setExamName] = (0, react_1.useState)("");
    const [newExamName, setNewExamName] = (0, react_1.useState)("");
    const [memo, setMemo] = (0, react_1.useState)("");
    const [examDate, setExamDate] = (0, react_1.useState)("");
    const [result, setResult] = (0, react_1.useState)("");
    const [score, setScore] = (0, react_1.useState)("");
    const [studyPeriod, setStudyPeriod] = (0, react_1.useState)("");
    const [studyTime, setStudyTime] = (0, react_1.useState)("");
    const [studyMethod, setStudyMethod] = (0, react_1.useState)("");
    const [difficulty, setDifficulty] = (0, react_1.useState)(3);
    const [details, setDetails] = (0, react_1.useState)("");
    // 詳細入力項目
    const [examFee, setExamFee] = (0, react_1.useState)("");
    const [questionCount, setQuestionCount] = (0, react_1.useState)("");
    const [questionLength, setQuestionLength] = (0, react_1.useState)("");
    const [examFormat, setExamFormat] = (0, react_1.useState)("");
    const [studyMaterials, setStudyMaterials] = (0, react_1.useState)("");
    const [studyHours, setStudyHours] = (0, react_1.useState)("");
    const [effectiveMethod, setEffectiveMethod] = (0, react_1.useState)("");
    const [frequentTopics, setFrequentTopics] = (0, react_1.useState)("");
    const [challengePoints, setChallengePoints] = (0, react_1.useState)("");
    const [passingTips, setPassingTips] = (0, react_1.useState)("");
    const [adviceForNext, setAdviceForNext] = (0, react_1.useState)("");
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
            const existingExams = data.map((r) => r.exam_name);
            setExamMaster(prev => Array.from(new Set([...prev, ...existingExams])));
            if (selectedRecord) {
                const updated = data.find(r => r.id === selectedRecord.id);
                if (updated)
                    setSelectedRecord(updated);
            }
        }
    };
    (0, react_1.useEffect)(() => {
        if (isLoggedIn)
            fetchRecords();
    }, [isLoggedIn]);
    /* =====================
        保存・アクション
    ===================== */
    const saveRecord = async () => {
        if (!userName || !examName || !memo) {
            alert("必須項目（★）を入力してください");
            return;
        }
        const detailsJson = JSON.stringify({
            examFee, questionCount, questionLength, examFormat,
            studyMaterials, studyHours, effectiveMethod,
            frequentTopics, challengePoints, passingTips, adviceForNext,
        });
        const { error } = await supabase.from("shikaku_memos").insert([{
                user_name: userName, exam_name: examName, memo,
                exam_date: examDate || null, result, score,
                study_period: studyPeriod, study_time: studyTime,
                study_method: studyMethod, difficulty, details: detailsJson,
                reactions: {}, comments: []
            }]);
        if (error) {
            alert("保存に失敗しました: " + error.message);
            return;
        }
        setMemo("");
        setExamFee("");
        setQuestionCount("");
        setQuestionLength("");
        setExamFormat("");
        setStudyMaterials("");
        setStudyHours("");
        setEffectiveMethod("");
        setFrequentTopics("");
        setChallengePoints("");
        setPassingTips("");
        setAdviceForNext("");
        fetchRecords();
    };
    const handleReaction = async (recordId, emoji) => {
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
    const deleteRecord = async (id) => {
        if (!confirm("投稿を削除しますか？"))
            return;
        await supabase.from("shikaku_memos").delete().eq("id", id);
        fetchRecords();
    };
    const saveEdit = async (id) => {
        await supabase.from("shikaku_memos").update({ memo: editingMemo }).eq("id", id);
        setEditingId(null);
        setEditingMemo("");
        fetchRecords();
    };
    /* =====================
        UI補助機能
    ===================== */
    const openCommentModal = (r) => {
        setSelectedRecord(r);
        setCommentName(userName);
        // メンションを自動挿入
        setCommentText(`@${r.user_name} `);
    };
    const formatDateTime = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };
    if (!isLoggedIn) {
        return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
        {/* 背景装飾グロー */}
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-900/30 rounded-full blur-3xl pointer-events-none"/>

        <form onSubmit={e => {
                e.preventDefault();
                if (password === SHARED_PASSWORD)
                    setIsLoggedIn(true);
                else
                    alert("パスワードが違います");
            }} className="relative bg-white/10 backdrop-blur-xl border border-white/15 p-10 rounded-3xl shadow-2xl w-96">

          {/* ロゴ・タイトル */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <img src="/widsley1.png" alt="Widsley" className="h-16 w-auto object-contain drop-shadow-lg" style={{ imageRendering: "auto" }}/>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">SHIKAKU SHARE</h1>
            <p className="text-indigo-300/80 text-xs mt-1.5 tracking-widest uppercase">資格試験メモ共有プラットフォーム</p>
          </div>

          {/* 入力欄 */}
          <div className="mb-5">
            <label className="block text-indigo-300 text-[10px] font-bold mb-2 tracking-[0.2em] uppercase">Password</label>
            <input type="password" className="w-full bg-white/8 border border-white/20 text-white placeholder-indigo-400/60 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all text-sm" placeholder="パスワードを入力" onChange={e => setPassword(e.target.value)}/>
          </div>

          {/* ログインボタン */}
          <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-xl font-bold text-sm hover:from-blue-400 hover:to-indigo-500 transition-all shadow-lg shadow-indigo-500/30 active:scale-95">
            ログイン
          </button>

          <p className="text-center text-indigo-400/60 text-[10px] mt-6 tracking-widest uppercase">社員専用サービス</p>
        </form>
      </div>);
    }
    const groupedRecords = examMaster.map(name => ({
        name,
        items: records.filter(r => r.exam_name === name)
    })).filter(group => group.items.length > 0 || examMaster.includes(group.name));
    const filteredGroups = groupedRecords.map(group => ({
        ...group,
        items: group.items.filter(r => searchQuery === "" ||
            r.exam_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.memo.toLowerCase().includes(searchQuery.toLowerCase()))
    })).filter(group => group.items.length > 0);
    return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative">
      {/* 背景グロー */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"/>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"/>

      {/* ===== サイドメニュー ===== */}
      {menuOpen && (<div className="fixed inset-0 z-50 flex">
          {/* オーバーレイ */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)}/>
          {/* ドロワー */}
          <div className="relative w-72 h-full bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl z-10">
            {/* ドロワーヘッダー */}
            <div className="p-6 border-b border-white/10">
              <img src="/widsley1.png" alt="Widsley" className="h-8 w-auto object-contain drop-shadow mb-4"/>
              <p className="text-[10px] text-indigo-400/60 tracking-[0.2em] uppercase">資格試験メモ共有プラットフォーム</p>
            </div>
            {/* メニュー項目 */}
            <nav className="flex-1 p-4 space-y-1">
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-100 hover:bg-white/8 transition-all text-sm font-bold">
                <span className="text-lg">🏠</span> ホーム
              </button>
              <button onClick={() => { setSearchOpen(true); setMenuOpen(false); setTimeout(() => document.getElementById("search-input")?.focus(), 100); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-100 hover:bg-white/8 transition-all text-sm font-bold">
                <span className="text-lg">🔍</span> 検索
              </button>
              <button onClick={() => { setMenuOpen(false); document.getElementById("post-form")?.scrollIntoView({ behavior: "smooth" }); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-100 hover:bg-white/8 transition-all text-sm font-bold">
                <span className="text-lg">✏️</span> 新規投稿
              </button>
              <div className="pt-4">
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
            {/* ログアウト */}
            <div className="p-4 border-t border-white/10">
              <button onClick={() => { setMenuOpen(false); setIsLoggedIn(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold">
                <span className="text-lg">🚪</span> ログアウト
              </button>
            </div>
          </div>
        </div>)}

      <div className="relative max-w-4xl mx-auto p-6 pb-20">

        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {/* ハンバーガーボタン */}
            <button onClick={() => setMenuOpen(true)} className="flex flex-col justify-center gap-1.5 w-10 h-10 items-center bg-white/8 border border-white/15 rounded-xl hover:bg-white/15 transition-all">
              <span className="w-5 h-0.5 bg-white rounded-full"></span>
              <span className="w-5 h-0.5 bg-white rounded-full"></span>
              <span className="w-3 h-0.5 bg-white rounded-full self-start ml-2.5"></span>
            </button>
            <div className="flex items-center gap-3">
              <img src="/widsley1.png" alt="Widsley" className="h-8 w-auto object-contain drop-shadow"/>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight leading-none">SHIKAKU SHARE</h1>
                <p className="text-indigo-400/70 text-[10px] tracking-widest uppercase">2026</p>
              </div>
            </div>
          </div>
          {/* 検索アイコン */}
          <button onClick={() => setSearchOpen(v => !v)} className={classNames("w-10 h-10 flex items-center justify-center rounded-xl border transition-all text-lg", searchOpen ? "bg-indigo-500/30 border-indigo-400/50 text-indigo-200" : "bg-white/8 border-white/15 text-indigo-300 hover:bg-white/15")}>🔍</button>
        </div>

        {/* 検索バー */}
        {searchOpen && (<div className="mb-6">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 text-sm">🔍</span>
              <input id="search-input" type="text" className="w-full bg-white/8 border border-indigo-400/40 rounded-xl pl-10 pr-10 py-3 text-white placeholder-indigo-400/50 text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" placeholder="資格名・感想で検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus/>
              {searchQuery && (<button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white transition-colors text-lg leading-none">&times;</button>)}
            </div>
            {searchQuery && (<p className="text-[10px] text-indigo-400/60 mt-2 pl-1">
                「{searchQuery}」の検索結果: <span className="text-indigo-300 font-bold">{filteredGroups.reduce((acc, g) => acc + g.items.length, 0)} 件</span>
              </p>)}
          </div>)}

        {/* 投稿フォーム */}
        <div id="post-form" className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6 mb-8 shadow-xl">
          <h2 className="text-[10px] font-bold text-indigo-300 tracking-[0.2em] uppercase mb-4">New Post</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input className="bg-white/8 border border-white/15 p-2.5 rounded-xl text-white placeholder-indigo-400/50 text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" placeholder="お名前 ★" value={userName} onChange={e => setUserName(e.target.value)}/>
            <select className="bg-slate-800 border border-white/15 p-2.5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" value={examName} onChange={e => setExamName(e.target.value)}>
              <option value="">資格を選択 ★</option>
              {examMaster.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="bg-indigo-950/60 border border-white/10 p-2 rounded-xl mb-4 flex gap-2">
            <input className="bg-transparent flex-1 text-sm text-white placeholder-indigo-400/50 outline-none" placeholder="リストにない資格を追加..." value={newExamName} onChange={e => setNewExamName(e.target.value)}/>
            <button onClick={() => { if (!newExamName)
        return; setExamMaster([...examMaster, newExamName]); setExamName(newExamName); setNewExamName(""); }} className="bg-indigo-600 text-white px-3 rounded-lg text-xs font-bold hover:bg-indigo-500 transition-all">追加</button>
          </div>

          <react_2.Tab.Group>
            <react_2.Tab.List className="flex space-x-1 border-b border-white/10 mb-4">
              {["入力項目", "詳細"].map(tab => (<react_2.Tab key={tab} className={({ selected }) => classNames("px-4 py-2 text-xs font-bold outline-none transition-all", selected ? "border-b-2 border-indigo-400 text-indigo-300" : "text-indigo-500/60 hover:text-indigo-400")}>{tab}</react_2.Tab>))}
            </react_2.Tab.List>
            <react_2.Tab.Panels>
              {/* ===== 入力項目タブ ===== */}
              <react_2.Tab.Panel className="space-y-5">

                {/* 一言コメント（必須） */}
                <div>
                  <label className="block text-[10px] text-indigo-400 font-bold tracking-widest uppercase mb-1.5">一言コメント ★</label>
                  <textarea className="bg-white/8 border border-white/15 p-3 w-full h-20 rounded-xl text-white placeholder-indigo-400/50 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none" placeholder="合格した感想を一言で..." value={memo} onChange={e => setMemo(e.target.value)}/>
                </div>

                {/* 試験概要 */}
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
        ].map(({ label, placeholder, val, set }) => (<div key={label}>
                        <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">{label}</label>
                        <input className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all" placeholder={placeholder} value={val} onChange={e => set(e.target.value)}/>
                      </div>))}
                  </div>
                </div>

                {/* 勉強について */}
                <div>
                  <p className="text-[9px] text-indigo-500/60 font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                    <span className="h-px bg-indigo-500/30 flex-1"></span>勉強について<span className="h-px bg-indigo-500/30 flex-1"></span>
                  </p>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">勉強時間</label>
                        <input className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all" placeholder="例: 3ヶ月・1日2時間" value={studyHours} onChange={e => setStudyHours(e.target.value)}/>
                      </div>
                      <div>
                        <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">使用教材</label>
                        <input className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all" placeholder="例: 公式テキスト・過去問" value={studyMaterials} onChange={e => setStudyMaterials(e.target.value)}/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">効果があった勉強法</label>
                      <textarea className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none h-16" placeholder="例: 過去問を繰り返し解いた" value={effectiveMethod} onChange={e => setEffectiveMethod(e.target.value)}/>
                    </div>
                  </div>
                </div>

                {/* 試験内容 */}
                <div>
                  <p className="text-[9px] text-indigo-500/60 font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                    <span className="h-px bg-indigo-500/30 flex-1"></span>試験内容<span className="h-px bg-indigo-500/30 flex-1"></span>
                  </p>
                  <div className="space-y-2">
                    {[
            { label: "頻出の内容", placeholder: "例: ○○分野が多く出題された", val: frequentTopics, set: setFrequentTopics },
            { label: "苦戦したポイント", placeholder: "例: 計算問題が難しかった", val: challengePoints, set: setChallengePoints },
        ].map(({ label, placeholder, val, set }) => (<div key={label}>
                        <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">{label}</label>
                        <textarea className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none h-16" placeholder={placeholder} value={val} onChange={e => set(e.target.value)}/>
                      </div>))}
                  </div>
                </div>

                {/* アドバイス */}
                <div>
                  <p className="text-[9px] text-indigo-500/60 font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                    <span className="h-px bg-indigo-500/30 flex-1"></span>合格に向けて<span className="h-px bg-indigo-500/30 flex-1"></span>
                  </p>
                  <div className="space-y-2">
                    {[
            { label: "合格へのコツ", placeholder: "例: 苦手分野を重点的に対策した", val: passingTips, set: setPassingTips },
            { label: "これから受ける方へのアドバイス", placeholder: "例: 早めに申し込みをおすすめします", val: adviceForNext, set: setAdviceForNext },
        ].map(({ label, placeholder, val, set }) => (<div key={label}>
                        <label className="block text-[10px] text-indigo-400/70 font-bold mb-1">{label}</label>
                        <textarea className="w-full bg-white/8 border border-white/10 p-2.5 rounded-xl text-white placeholder-indigo-500/40 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none h-16" placeholder={placeholder} value={val} onChange={e => set(e.target.value)}/>
                      </div>))}
                  </div>
                </div>

              </react_2.Tab.Panel>

              {/* ===== 詳細タブ ===== */}
              <react_2.Tab.Panel>
                <div className="flex gap-2 mb-3 items-center">
                  <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase mr-1">難易度</span>
                  {[1, 2, 3, 4, 5].map(n => (<button key={n} onClick={() => setDifficulty(n)} className={`text-xl transition-transform hover:scale-110 ${n <= difficulty ? "text-yellow-400" : "text-white/15"}`}>★</button>))}
                </div>
              </react_2.Tab.Panel>
            </react_2.Tab.Panels>
          </react_2.Tab.Group>

          <button onClick={saveRecord} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-xl font-bold mt-4 text-sm hover:from-blue-400 hover:to-indigo-500 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">投稿を保存</button>
        </div>

        {/* 一覧表示 */}
        <div className="space-y-5">
          {filteredGroups.map(group => (<div key={group.name} className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3 flex justify-between items-center border-b border-white/10 bg-indigo-950/40">
                <span className="text-sm font-bold text-indigo-200">📁 {group.name}</span>
                <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase">{group.items.length} Posts</span>
              </div>
              <div className="p-5 space-y-5">
                {group.items.map(r => (<div key={r.id} className="border-b border-white/8 last:border-0 pb-5 group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-white text-sm">{r.user_name}</span>
                        <span className="ml-3 text-[10px] text-indigo-400/60">{formatDateTime(r.created_at)}</span>
                      </div>
                      <span className="text-yellow-400 text-xs">{"★".repeat(r.difficulty)}</span>
                    </div>

                    {editingId === r.id ? (<div className="mt-2 space-y-2">
                        <textarea className="bg-white/8 border border-white/15 p-2 w-full rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-400 resize-none" value={editingMemo} onChange={e => setEditingMemo(e.target.value)}/>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(r.id)} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-500 transition-all">保存</button>
                          <button onClick={() => setEditingId(null)} className="bg-white/15 text-white/70 px-3 py-1 rounded-lg text-xs font-bold hover:bg-white/20 transition-all">キャンセル</button>
                        </div>
                      </div>) : (<p className="text-indigo-100/80 text-sm mb-3 whitespace-pre-wrap leading-relaxed">{r.memo}</p>)}

                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {REACTION_OPTIONS.map(emoji => (<button key={emoji} onClick={() => handleReaction(r.id, emoji)} className="text-xs bg-white/5 border border-white/10 rounded-full px-2 py-0.5 hover:bg-indigo-500/20 hover:border-indigo-400/40 active:scale-125 transition-all">
                            {emoji} <span className="font-bold text-indigo-300/70">{r.reactions?.[emoji] || 0}</span>
                          </button>))}
                      </div>
                      <div className="flex gap-3 ml-auto items-center">
                        <button onClick={() => { setEditingId(r.id); setEditingMemo(r.memo); }} className="text-[10px] font-bold text-indigo-400/40 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-all">編集</button>
                        <button onClick={() => deleteRecord(r.id)} className="text-[10px] font-bold text-indigo-400/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">削除</button>
                        <button onClick={() => openCommentModal(r)} className="text-xs font-bold text-indigo-400 hover:text-indigo-200 flex items-center gap-1 transition-colors">
                          💬 返信 ({r.comments?.length || 0})
                        </button>
                      </div>
                    </div>
                  </div>))}
              </div>
            </div>))}
        </div>
      </div>

      {/* コメント・詳細モーダル */}
      <react_2.Dialog open={!!selectedRecord} onClose={() => setSelectedRecord(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"/>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <react_2.Dialog.Panel className="bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-indigo-950/50">
              <react_2.Dialog.Title className="text-sm font-bold text-white tracking-wide">スレッド形式の返信</react_2.Dialog.Title>
              <button onClick={() => setSelectedRecord(null)} className="text-indigo-400 hover:text-white text-2xl transition-colors leading-none">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* 元の投稿 */}
              <div className="border-l-4 border-indigo-500 pl-4 py-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">{selectedRecord?.user_name}</p>
                  <span className="text-[9px] text-indigo-500/50">{selectedRecord && formatDateTime(selectedRecord.created_at)}</span>
                </div>
                <p className="text-indigo-100/90 text-sm leading-relaxed">{selectedRecord?.memo}</p>

                {/* 詳細フィールド表示 */}
                {(() => {
            if (!selectedRecord?.details)
                return null;
            let d = {};
            try {
                d = JSON.parse(selectedRecord.details);
            }
            catch {
                return null;
            }
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
            if (rows.length === 0)
                return null;
            return (<div className="mt-4 space-y-2">
                      {rows.map(({ label, val }) => (<div key={label} className="bg-white/5 border border-white/8 rounded-xl p-3">
                          <p className="text-[9px] text-indigo-400/60 font-bold tracking-widest uppercase mb-1">{label}</p>
                          <p className="text-xs text-indigo-100/80 leading-relaxed whitespace-pre-wrap">{val}</p>
                        </div>))}
                    </div>);
        })()}
              </div>

              {/* 返信一覧 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <h4 className="text-[10px] font-bold text-indigo-500/60 tracking-widest uppercase">Replies</h4>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>
                {(selectedRecord?.comments || []).length === 0 ? (<p className="text-xs text-indigo-500/50 italic text-center py-4">まだ返信はありません</p>) : (selectedRecord.comments.map((c) => (<div key={c.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-indigo-300">{c.user_name}</span>
                        <span className="text-[9px] text-indigo-500/50">{formatDateTime(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-indigo-100/80 leading-relaxed bg-white/5 border border-white/10 p-3 rounded-xl">
                        {c.text.startsWith('@') ? (<>
                            <span className="text-indigo-400 font-bold">{c.text.split(' ')[0]}</span>
                            {c.text.substring(c.text.split(' ')[0].length)}
                          </>) : c.text}
                      </p>
                    </div>)))}
              </div>
            </div>

            {/* 返信入力欄 */}
            <div className="p-5 border-t border-white/10 bg-indigo-950/40">
              <div className="flex gap-2 mb-2">
                <input className="bg-white/8 border border-white/15 p-2 flex-1 rounded-xl text-xs text-white placeholder-indigo-400/50 outline-none focus:ring-2 focus:ring-indigo-400 transition-all" placeholder="お名前" value={commentName} onChange={e => setCommentName(e.target.value)}/>
              </div>
              <div className="flex gap-2 items-end">
                <textarea className="bg-white/8 border border-white/15 p-3 flex-1 rounded-xl text-sm text-white placeholder-indigo-400/50 h-20 outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none" placeholder="返信内容を入力してください..." value={commentText} onChange={e => setCommentText(e.target.value)}/>
                <button onClick={addComment} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:from-blue-400 hover:to-indigo-500 shadow-lg shadow-indigo-500/30 transition-all active:scale-95">送信</button>
              </div>
            </div>
          </react_2.Dialog.Panel>
        </div>
      </react_2.Dialog>
    </div>);
}
//# sourceMappingURL=page.js.map