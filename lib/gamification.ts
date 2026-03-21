// ==================== XP Map ====================
export const XP_MAP: Record<string, number> = {
  // 国家資格
  "ITパスポート": 100,
  "基本情報技術者試験（FE）": 300,
  "応用情報技術者試験（AP）": 500,
  "情報セキュリティマネジメント試験": 300,
  "情報処理安全確保支援士（RISS）": 500,
  "ネットワークスペシャリスト": 500,
  "データベーススペシャリスト": 500,
  // AWS
  "AWS Cloud Practitioner": 100,
  "AWS Solutions Architect Associate（SAA）": 300,
  "AWS Solutions Architect Professional（SAP）": 500,
  "AWS Developer Associate（DVA）": 300,
  "AWS SysOps Administrator Associate": 300,
  // Google Cloud
  "Google Cloud Associate Cloud Engineer": 300,
  "Google Cloud Professional Cloud Architect": 500,
  "Google Cloud Professional Data Engineer": 500,
  // Azure
  "Microsoft Azure Fundamentals（AZ-900）": 100,
  "Microsoft Azure Administrator（AZ-104）": 300,
  "Microsoft Azure Solutions Architect（AZ-305）": 500,
  // Security
  "CC（Certified in Cybersecurity）": 100,
  "CompTIA Security+": 300,
  "SSCP（Systems Security Certified Practitioner）": 300,
  "CCSP（Certified Cloud Security Professional）": 500,
  "CISSP": 500,
  // Network
  "CompTIA Network+": 300,
  "CCNA": 300,
  "CCNP Enterprise": 500,
  // Oracle Java
  "Oracle Java SE Bronze": 100,
  "Oracle Java SE Silver": 300,
  "Oracle Java SE Gold": 500,
  // Oracle DB
  "Oracle Database SQL（Bronze）": 300,
  "Oracle Database Administrator（Silver）": 300,
  // Oracle Cloud
  "Oracle Cloud Infrastructure Foundations": 100,
  "Oracle Cloud Infrastructure Architect Associate": 300,
  // Programming
  "Python 3 エンジニア認定基礎試験": 100,
  "PHP技術者認定試験（初級）": 100,
  "HTML5プロフェッショナル認定（Lv.1）": 100,
  "Ruby Association Certified Silver": 300,
  // Infra
  "LPIC-1 / LinuC Level 1": 300,
  "HashiCorp Terraform Associate": 300,
  // Container
  "Docker Certified Associate（DCA）": 300,
  "CKA（Certified Kubernetes Administrator）": 500,
  "CKAD（Certified Kubernetes Application Developer）": 500,
  "CKS（Certified Kubernetes Security Specialist）": 500,
};

// ==================== Level System ====================
export type LevelInfo = {
  level: number;
  xp: number;
  title: string;
  icon: string;
  color: string;
};

export const LEVELS: LevelInfo[] = [
  { level: 1,  xp: 0,     title: "見習いエンジニア",   icon: "🌱", color: "from-emerald-600 to-green-500" },
  { level: 2,  xp: 200,   title: "ジュニアエンジニア", icon: "📗", color: "from-green-600 to-teal-500" },
  { level: 3,  xp: 500,   title: "エンジニア",         icon: "💻", color: "from-blue-600 to-indigo-500" },
  { level: 4,  xp: 1000,  title: "シニアエンジニア",   icon: "⚡", color: "from-indigo-600 to-violet-500" },
  { level: 5,  xp: 2000,  title: "テックリード",       icon: "🔥", color: "from-violet-600 to-purple-500" },
  { level: 6,  xp: 3500,  title: "アーキテクト",       icon: "🏗️", color: "from-purple-600 to-pink-500" },
  { level: 7,  xp: 5500,  title: "エキスパート",       icon: "🎯", color: "from-pink-600 to-rose-500" },
  { level: 8,  xp: 8000,  title: "プリンシパル",       icon: "👑", color: "from-rose-600 to-orange-500" },
  { level: 9,  xp: 11000, title: "フェロー",           icon: "🌟", color: "from-orange-600 to-yellow-500" },
  { level: 10, xp: 15000, title: "伝説のエンジニア",   icon: "🏆", color: "from-yellow-500 to-amber-400" },
];

export function getLevelInfo(totalXp: number) {
  let currentIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].xp) { currentIdx = i; break; }
  }
  const current = LEVELS[currentIdx];
  const next = LEVELS[currentIdx + 1] ?? null;
  const xpInLevel = totalXp - current.xp;
  const xpForNext = next ? next.xp - current.xp : null;
  const progress = xpForNext ? Math.min((xpInLevel / xpForNext) * 100, 100) : 100;
  return { current, next, xpInLevel, xpForNext, progress, totalXp };
}

export function getXpForExam(examName: string): number {
  return XP_MAP[examName] ?? 100;
}

// ==================== Roadmap ====================
export const ROADMAP: Record<string, string[]> = {
  "ITパスポート": ["基本情報技術者試験（FE）"],
  "基本情報技術者試験（FE）": ["応用情報技術者試験（AP）", "AWS Cloud Practitioner"],
  "応用情報技術者試験（AP）": ["情報処理安全確保支援士（RISS）", "ネットワークスペシャリスト", "データベーススペシャリスト"],
  "AWS Cloud Practitioner": ["AWS Solutions Architect Associate（SAA）", "AWS Developer Associate（DVA）"],
  "AWS Solutions Architect Associate（SAA）": ["AWS Solutions Architect Professional（SAP）", "AWS SysOps Administrator Associate"],
  "AWS Developer Associate（DVA）": ["AWS Solutions Architect Professional（SAP）"],
  "Microsoft Azure Fundamentals（AZ-900）": ["Microsoft Azure Administrator（AZ-104）"],
  "Microsoft Azure Administrator（AZ-104）": ["Microsoft Azure Solutions Architect（AZ-305）"],
  "CC（Certified in Cybersecurity）": ["CompTIA Security+", "SSCP（Systems Security Certified Practitioner）"],
  "CompTIA Security+": ["CISSP", "CCSP（Certified Cloud Security Professional）"],
  "SSCP（Systems Security Certified Practitioner）": ["CISSP"],
  "CompTIA Network+": ["CCNA"],
  "CCNA": ["CCNP Enterprise"],
  "Oracle Java SE Bronze": ["Oracle Java SE Silver"],
  "Oracle Java SE Silver": ["Oracle Java SE Gold"],
  "Oracle Database SQL（Bronze）": ["Oracle Database Administrator（Silver）"],
  "Oracle Cloud Infrastructure Foundations": ["Oracle Cloud Infrastructure Architect Associate"],
  "Docker Certified Associate（DCA）": ["CKA（Certified Kubernetes Administrator）", "CKAD（Certified Kubernetes Application Developer）"],
  "CKA（Certified Kubernetes Administrator）": ["CKS（Certified Kubernetes Security Specialist）"],
  "CKAD（Certified Kubernetes Application Developer）": ["CKS（Certified Kubernetes Security Specialist）"],
  "LPIC-1 / LinuC Level 1": ["HashiCorp Terraform Associate", "Docker Certified Associate（DCA）"],
  "情報セキュリティマネジメント試験": ["情報処理安全確保支援士（RISS）", "CompTIA Security+"],
};

export function getRecommendations(ownedExams: string[]): { from: string; next: string; xp: number }[] {
  const ownedSet = new Set(ownedExams);
  const seen = new Set<string>();
  const result: { from: string; next: string; xp: number }[] = [];
  for (const exam of ownedExams) {
    for (const next of ROADMAP[exam] ?? []) {
      if (!ownedSet.has(next) && !seen.has(next)) {
        seen.add(next);
        result.push({ from: exam, next, xp: getXpForExam(next) });
      }
    }
  }
  return result;
}
