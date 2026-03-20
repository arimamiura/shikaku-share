"use client";

import { useState } from "react";
import Link from "next/link";

// ==================== Types ====================
type TagWeights = Record<string, number>;

type AnswerOption = {
  text: string;
  emoji: string;
  tags: TagWeights;
};

type Question = {
  emoji: string;
  text: string;
  sub?: string;
  answers: AnswerOption[];
};

type Qualification = {
  name: string;
  category: string;
  icon: string;
  tags: string[];
  level: "入門" | "中級" | "上級";
  hours: string;
  fee: string;
  format: string;
  english: "日本語対応" | "英語必須" | "日英選択可";
  validity: string;
  next: string[];
  description: string;
  score?: number;
  fromOwned?: string[]; // 保有資格からおすすめされた場合、その資格名リスト
};

// ==================== Questions ====================
const QUESTIONS: Question[] = [
  {
    emoji: "🎯",
    text: "ITの経験はどのくらい？",
    sub: "正直に答えてね！",
    answers: [
      { text: "ほぼ未経験・これからスタート！", emoji: "🌱", tags: { entry: 4, national: 2 } },
      { text: "1〜2年くらい", emoji: "📖", tags: { entry: 1, mid: 3, national: 1 } },
      { text: "3〜5年くらい", emoji: "⚡", tags: { mid: 4, senior: 1 } },
      { text: "5年以上のベテラン！", emoji: "🔥", tags: { mid: 1, senior: 4 } },
    ],
  },
  {
    emoji: "🔍",
    text: "どんな分野に興味ある？",
    sub: "一番ピンとくるやつ！",
    answers: [
      { text: "クラウド・インフラ系", emoji: "☁️", tags: { cloud: 3, infra: 2 } },
      { text: "セキュリティ系", emoji: "🔒", tags: { security: 4 } },
      { text: "開発・プログラミング系", emoji: "💻", tags: { dev: 4, container: 1 } },
      { text: "ネットワーク・DB系", emoji: "🌐", tags: { network: 3, db: 3 } },
    ],
  },
  {
    emoji: "⏰",
    text: "勉強に使える時間は？",
    sub: "週あたりで教えてね",
    answers: [
      { text: "週2〜3時間くらい", emoji: "🐢", tags: { entry: 3 } },
      { text: "週5〜10時間", emoji: "🚶", tags: { entry: 1, mid: 2 } },
      { text: "週10〜20時間", emoji: "🏃", tags: { mid: 3, senior: 1 } },
      { text: "週20時間以上！本気モード", emoji: "🚀", tags: { mid: 1, senior: 3 } },
    ],
  },
  {
    emoji: "🌍",
    text: "英語どのくらいいける？",
    answers: [
      { text: "日本語オンリーで行く！", emoji: "🇯🇵", tags: { japanese: 4, english_penalty: 5 } },
      { text: "読むくらいならなんとか", emoji: "📝", tags: { japanese: 2 } },
      { text: "ある程度読める", emoji: "👍", tags: {} },
      { text: "英語も全然OK！", emoji: "🌐", tags: { english_ok: 3 } },
    ],
  },
  {
    emoji: "🏢",
    text: "今の立場は？",
    answers: [
      { text: "学生・就活準備中", emoji: "🎓", tags: { entry: 3, national: 3 } },
      { text: "IT業界に入ったばかり", emoji: "👶", tags: { entry: 2, mid: 1, national: 2 } },
      { text: "中堅エンジニア", emoji: "💼", tags: { mid: 3, senior: 1 } },
      { text: "シニア・マネージャー", emoji: "🦁", tags: { senior: 4 } },
    ],
  },
  {
    emoji: "🏆",
    text: "資格を取る一番の目的は？",
    answers: [
      { text: "転職・就活に使いたい", emoji: "📋", tags: { national: 3, entry: 1 } },
      { text: "スキルを対外的に証明したい", emoji: "🏅", tags: { mid: 2, senior: 1 } },
      { text: "業務で直接活かしたい", emoji: "🔧", tags: { cloud: 1, dev: 1, infra: 1 } },
      { text: "自己成長・趣味で挑戦！", emoji: "✨", tags: { senior: 1, mid: 1, entry: 1 } },
    ],
  },
  {
    emoji: "☁️",
    text: "クラウドは何を使ってる？",
    sub: "使ったことなくてもOK！",
    answers: [
      { text: "まだ触ったことない", emoji: "🤔", tags: { entry: 1 } },
      { text: "AWS中心", emoji: "🟠", tags: { aws: 4 } },
      { text: "Google Cloud / GCP", emoji: "🔵", tags: { gcp: 4 } },
      { text: "Azure", emoji: "🔷", tags: { azure: 4 } },
    ],
  },
];

// ==================== Qualifications ====================
const QUALIFICATIONS: Qualification[] = [
  // 国家資格
  {
    name: "ITパスポート",
    category: "国家資格",
    icon: "🌱",
    tags: ["entry", "japanese", "national"],
    level: "入門",
    hours: "50〜100時間",
    fee: "約7,500円",
    format: "選択式 / 100問 / 120分",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: ["基本情報技術者試験"],
    description: "IT全般の基礎知識を幅広くカバーする国家資格。非エンジニアにも人気。",
  },
  {
    name: "基本情報技術者試験（FE）",
    category: "国家資格",
    icon: "📘",
    tags: ["entry", "mid", "japanese", "national", "dev"],
    level: "中級",
    hours: "100〜200時間",
    fee: "約7,500円",
    format: "選択式＋擬似言語 / 午前・午後",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: ["応用情報技術者試験"],
    description: "エンジニアの登竜門。幅広いIT知識とプログラミング的思考を問う国家資格。",
  },
  {
    name: "応用情報技術者試験（AP）",
    category: "国家資格",
    icon: "📗",
    tags: ["mid", "japanese", "national"],
    level: "中級",
    hours: "200〜400時間",
    fee: "約7,500円",
    format: "選択式＋記述式 / 午前・午後",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: ["各種高度情報処理技術者試験"],
    description: "基本情報の上位資格。より実践的な知識を問う。手当が出る企業も多い。",
  },
  {
    name: "情報セキュリティマネジメント試験",
    category: "国家資格",
    icon: "🔐",
    tags: ["entry", "mid", "japanese", "national", "security"],
    level: "中級",
    hours: "100〜150時間",
    fee: "約7,500円",
    format: "選択式 / 午前・午後",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: ["情報処理安全確保支援士"],
    description: "組織のセキュリティマネジメントを担う人材向けの国家資格。",
  },
  {
    name: "情報処理安全確保支援士（RISS）",
    category: "国家資格",
    icon: "🛡️",
    tags: ["senior", "japanese", "national", "security"],
    level: "上級",
    hours: "400〜600時間",
    fee: "約7,500円（登録費用別途）",
    format: "選択式＋記述式＋論述 / 午前・午後",
    english: "日本語対応",
    validity: "3年ごと更新",
    next: [],
    description: "唯一の国家「士業」セキュリティ資格。登録制で社会的信頼度が高い。",
  },
  {
    name: "ネットワークスペシャリスト",
    category: "国家資格",
    icon: "📡",
    tags: ["senior", "japanese", "national", "network"],
    level: "上級",
    hours: "400〜600時間",
    fee: "約7,500円",
    format: "選択式＋記述式＋論述 / 午前・午後",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: [],
    description: "ネットワーク設計・構築の国家最高峰資格。合格率は15〜20%前後。",
  },
  {
    name: "データベーススペシャリスト",
    category: "国家資格",
    icon: "🗄️",
    tags: ["senior", "japanese", "national", "db"],
    level: "上級",
    hours: "400〜600時間",
    fee: "約7,500円",
    format: "選択式＋記述式＋論述 / 午前・午後",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: [],
    description: "データベース設計・管理の国家最高峰資格。SQL力も要求される難関。",
  },
  // AWS
  {
    name: "AWS Cloud Practitioner",
    category: "AWS",
    icon: "🟠",
    tags: ["entry", "cloud", "aws"],
    level: "入門",
    hours: "30〜80時間",
    fee: "約15,000円",
    format: "選択式 / 65問 / 90分",
    english: "日英選択可",
    validity: "3年（再認定要）",
    next: ["AWS SAA", "AWS DVA"],
    description: "AWSの入門資格。クラウドの基本とAWSサービスの概要を学べる。",
  },
  {
    name: "AWS Solutions Architect Associate（SAA）",
    category: "AWS",
    icon: "🏗️",
    tags: ["mid", "cloud", "aws", "infra"],
    level: "中級",
    hours: "150〜200時間",
    fee: "約16,500円",
    format: "選択式 / 65問 / 130分",
    english: "日英選択可",
    validity: "3年（再認定要）",
    next: ["AWS SAP", "AWS SysOps"],
    description: "AWSで最も人気の資格。クラウドアーキテクチャ設計の実践知識を問う。",
  },
  {
    name: "AWS Solutions Architect Professional（SAP）",
    category: "AWS",
    icon: "🏆",
    tags: ["senior", "cloud", "aws", "infra"],
    level: "上級",
    hours: "300〜400時間",
    fee: "約30,000円",
    format: "選択式 / 75問 / 180分",
    english: "日英選択可",
    validity: "3年（再認定要）",
    next: [],
    description: "AWS最高峰資格の一つ。複雑なアーキテクチャ設計・最適化を問う難関資格。",
  },
  {
    name: "AWS Developer Associate（DVA）",
    category: "AWS",
    icon: "💻",
    tags: ["mid", "cloud", "aws", "dev"],
    level: "中級",
    hours: "100〜150時間",
    fee: "約16,500円",
    format: "選択式 / 65問 / 130分",
    english: "日英選択可",
    validity: "3年（再認定要）",
    next: ["AWS DevOps Pro"],
    description: "AWSを使ったアプリ開発者向け。CI/CD・Lambda・DynamoDBが頻出。",
  },
  {
    name: "AWS SysOps Administrator Associate",
    category: "AWS",
    icon: "⚙️",
    tags: ["mid", "cloud", "aws", "infra"],
    level: "中級",
    hours: "150〜200時間",
    fee: "約16,500円",
    format: "選択式＋ラボ試験 / 65問",
    english: "日英選択可",
    validity: "3年（再認定要）",
    next: ["AWS DevOps Pro"],
    description: "AWSシステム運用管理者向け。唯一ハンズオンラボが含まれるユニークな試験。",
  },
  // Google Cloud
  {
    name: "Google Cloud Associate Cloud Engineer",
    category: "Google Cloud",
    icon: "🔵",
    tags: ["mid", "cloud", "gcp", "infra"],
    level: "中級",
    hours: "100〜200時間",
    fee: "約20,000円",
    format: "選択式 / 50問 / 120分",
    english: "日英選択可",
    validity: "3年（再認定要）",
    next: ["GCP Professional Cloud Architect"],
    description: "Google Cloudの実践的な操作・管理能力を証明する資格。",
  },
  {
    name: "Google Cloud Professional Cloud Architect",
    category: "Google Cloud",
    icon: "🏛️",
    tags: ["senior", "cloud", "gcp", "infra"],
    level: "上級",
    hours: "200〜300時間",
    fee: "約20,000円",
    format: "選択式 / 60問 / 120分",
    english: "日英選択可",
    validity: "2年（再認定要）",
    next: [],
    description: "GCP最高峰。クラウドアーキテクチャ設計の専門知識を証明。世界的評価が高い。",
  },
  {
    name: "Google Cloud Professional Data Engineer",
    category: "Google Cloud",
    icon: "📊",
    tags: ["senior", "cloud", "gcp", "db"],
    level: "上級",
    hours: "200〜300時間",
    fee: "約20,000円",
    format: "選択式 / 50問 / 120分",
    english: "日英選択可",
    validity: "2年（再認定要）",
    next: [],
    description: "データ基盤・BigQuery・MLパイプラインの専門知識を証明する上位資格。",
  },
  // Azure
  {
    name: "Microsoft Azure Fundamentals（AZ-900）",
    category: "Azure",
    icon: "🔷",
    tags: ["entry", "cloud", "azure"],
    level: "入門",
    hours: "30〜60時間",
    fee: "約12,500円",
    format: "選択式 / 40〜60問 / 60分",
    english: "日英選択可",
    validity: "永続（更新不要）",
    next: ["AZ-104", "AZ-204"],
    description: "Azureの基礎入門資格。クラウド初心者がAzureを体系的に学ぶ第一歩。",
  },
  {
    name: "Microsoft Azure Administrator（AZ-104）",
    category: "Azure",
    icon: "⚡",
    tags: ["mid", "cloud", "azure", "infra"],
    level: "中級",
    hours: "150〜200時間",
    fee: "約18,500円",
    format: "選択式＋ケーススタディ / 40〜60問",
    english: "日英選択可",
    validity: "1年（更新要）",
    next: ["AZ-305"],
    description: "Azureインフラ管理者向け。仮想マシン・ネットワーク・セキュリティを網羅。",
  },
  {
    name: "Microsoft Azure Solutions Architect（AZ-305）",
    category: "Azure",
    icon: "🏰",
    tags: ["senior", "cloud", "azure", "infra"],
    level: "上級",
    hours: "250〜350時間",
    fee: "約18,500円",
    format: "選択式＋ケーススタディ",
    english: "日英選択可",
    validity: "1年（更新要）",
    next: [],
    description: "Azure最高峰資格。エンタープライズレベルのアーキテクチャ設計能力を証明。",
  },
  // Security
  {
    name: "CC（Certified in Cybersecurity）",
    category: "セキュリティ",
    icon: "🛡️",
    tags: ["entry", "security"],
    level: "入門",
    hours: "50〜100時間",
    fee: "無料（ISC2会員登録で受験可）",
    format: "選択式 / 100問 / 120分",
    english: "日英選択可",
    validity: "3年（CPEポイント要）",
    next: ["SSCP", "CompTIA Security+"],
    description: "ISC2のセキュリティ入門資格。なんと無料で受験可能！セキュリティキャリアの第一歩に最適。",
  },
  {
    name: "CompTIA Security+",
    category: "セキュリティ",
    icon: "🔐",
    tags: ["mid", "security"],
    level: "中級",
    hours: "100〜150時間",
    fee: "約40,000円",
    format: "選択式＋記述式 / 90問以下 / 90分",
    english: "日英選択可",
    validity: "3年（CEU要）",
    next: ["SSCP", "CISSP"],
    description: "ベンダー中立のセキュリティ資格。米国政府・軍でも認定される国際標準資格。",
  },
  {
    name: "SSCP（Systems Security Certified Practitioner）",
    category: "セキュリティ",
    icon: "🔒",
    tags: ["mid", "security"],
    level: "中級",
    hours: "150〜200時間",
    fee: "約30,000円",
    format: "選択式 / 125問 / 180分",
    english: "日英選択可",
    validity: "3年（CPEポイント要）",
    next: ["CISSP"],
    description: "ISC2のCISSP前段となる実践セキュリティ資格。現場技術者向けの中核資格。",
  },
  {
    name: "CCSP（Certified Cloud Security Professional）",
    category: "セキュリティ",
    icon: "🔏",
    tags: ["senior", "security", "cloud"],
    level: "上級",
    hours: "200〜300時間",
    fee: "約60,000円",
    format: "選択式 / 150問 / 240分",
    english: "英語必須",
    validity: "3年（CPEポイント要）",
    next: [],
    description: "クラウドセキュリティの国際最高峰資格。CISSPとの相性も抜群。",
  },
  {
    name: "CISSP",
    category: "セキュリティ",
    icon: "👑",
    tags: ["senior", "security"],
    level: "上級",
    hours: "500時間以上",
    fee: "約80,000円",
    format: "CAT形式 / 100〜150問 / 180分",
    english: "英語必須",
    validity: "3年（CPEポイント要）",
    next: [],
    description: "セキュリティの最高峰。「情報セキュリティのMBA」と呼ばれる国際資格。5年の実務経験が必要。",
  },
  // Network
  {
    name: "CompTIA Network+",
    category: "ネットワーク",
    icon: "🌐",
    tags: ["mid", "network"],
    level: "中級",
    hours: "100〜150時間",
    fee: "約40,000円",
    format: "選択式＋記述式 / 90問以下 / 90分",
    english: "日英選択可",
    validity: "3年（CEU要）",
    next: ["CCNA"],
    description: "ベンダー中立のネットワーク基礎資格。CCNAへの足がかりとして最適。",
  },
  {
    name: "CCNA",
    category: "ネットワーク",
    icon: "📶",
    tags: ["mid", "network"],
    level: "中級",
    hours: "200〜300時間",
    fee: "約42,000円",
    format: "選択式・記述式 / 100〜120問 / 120分",
    english: "日英選択可",
    validity: "3年（再認定要）",
    next: ["CCNP"],
    description: "Ciscoネットワーク資格の定番。ネットワークエンジニア必携の中核資格。",
  },
  {
    name: "CCNP Enterprise",
    category: "ネットワーク",
    icon: "🔗",
    tags: ["senior", "network"],
    level: "上級",
    hours: "400〜600時間",
    fee: "約70,000円〜（複数試験）",
    format: "選択式・記述式 / 複数試験構成",
    english: "英語必須",
    validity: "3年（再認定要）",
    next: ["CCIE"],
    description: "Ciscoの上級ネットワーク資格。エンタープライズネットワーク設計の専門家向け。",
  },
  // Oracle Java
  {
    name: "Oracle Java SE Bronze",
    category: "Oracle / Java",
    icon: "☕",
    tags: ["entry", "dev", "japanese", "oracle"],
    level: "入門",
    hours: "50〜100時間",
    fee: "約26,000円",
    format: "選択式 / 60問 / 65分",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: ["Oracle Java SE Silver"],
    description: "Javaプログラミングの入門資格。オブジェクト指向の基礎をしっかり学べる。",
  },
  {
    name: "Oracle Java SE Silver",
    category: "Oracle / Java",
    icon: "☕⚡",
    tags: ["mid", "dev", "japanese", "oracle"],
    level: "中級",
    hours: "100〜200時間",
    fee: "約32,000円",
    format: "選択式 / 77問 / 90分",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: ["Oracle Java SE Gold"],
    description: "Java開発の実践スキルを証明。企業の採用評価が高い実力証明資格。",
  },
  {
    name: "Oracle Java SE Gold",
    category: "Oracle / Java",
    icon: "🥇",
    tags: ["senior", "dev", "oracle"],
    level: "上級",
    hours: "200〜350時間",
    fee: "約32,000円",
    format: "選択式 / 60問 / 90分",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: [],
    description: "Java資格の最高峰。マルチスレッド・並行処理・ストリームAPIまで問う難関。",
  },
  // Oracle DB
  {
    name: "Oracle Database SQL（Bronze）",
    category: "Oracle / DB",
    icon: "🗃️",
    tags: ["entry", "mid", "db", "japanese", "oracle"],
    level: "中級",
    hours: "80〜150時間",
    fee: "約26,000円",
    format: "選択式 / 70問 / 90分",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: ["Oracle DB Silver"],
    description: "Oracle DBのSQL操作基礎を問う。DBエンジニア入門として幅広く使える。",
  },
  {
    name: "Oracle Database Administrator（Silver）",
    category: "Oracle / DB",
    icon: "🏅",
    tags: ["mid", "db", "oracle"],
    level: "中級",
    hours: "150〜250時間",
    fee: "約32,000円",
    format: "選択式 / 80問 / 120分",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: ["Oracle DB Gold"],
    description: "Oracle DBの管理・運用スキルを証明する中核資格。DBA志望者必携。",
  },
  // Oracle Cloud
  {
    name: "Oracle Cloud Infrastructure Foundations",
    category: "Oracle Cloud",
    icon: "🔶",
    tags: ["entry", "cloud", "oracle"],
    level: "入門",
    hours: "30〜60時間",
    fee: "無料",
    format: "選択式 / 60問 / 90分",
    english: "日英選択可",
    validity: "永続（更新不要）",
    next: ["OCI Architect Associate"],
    description: "Oracle Cloudの入門資格。なんと無料で受験できる！OCIの基礎知識を問う。",
  },
  {
    name: "Oracle Cloud Infrastructure Architect Associate",
    category: "Oracle Cloud",
    icon: "🔶🏗️",
    tags: ["mid", "cloud", "oracle", "infra"],
    level: "中級",
    hours: "100〜200時間",
    fee: "約25,000円",
    format: "選択式 / 60問 / 90分",
    english: "日英選択可",
    validity: "永続（更新不要）",
    next: ["OCI Architect Professional"],
    description: "OCIのアーキテクチャ設計スキルを証明。AWSと比較しながら学べる。",
  },
  // Programming
  {
    name: "Python 3 エンジニア認定基礎試験",
    category: "プログラミング",
    icon: "🐍",
    tags: ["entry", "mid", "dev", "japanese"],
    level: "入門",
    hours: "50〜100時間",
    fee: "約11,000円",
    format: "選択式 / 40問 / 60分",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: ["Python データ分析試験"],
    description: "Python文法の基礎を問う試験。AIエンジニアへの第一歩としても大人気。",
  },
  {
    name: "PHP技術者認定試験（初級）",
    category: "プログラミング",
    icon: "🐘",
    tags: ["entry", "mid", "dev", "japanese"],
    level: "入門",
    hours: "50〜100時間",
    fee: "約11,000円",
    format: "選択式 / 50問 / 90分",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: ["PHP上級"],
    description: "PHPのWeb開発基礎を問う。Web系エンジニアの登竜門として長く支持される資格。",
  },
  {
    name: "HTML5プロフェッショナル認定（Lv.1）",
    category: "プログラミング",
    icon: "🌐",
    tags: ["entry", "mid", "dev", "japanese"],
    level: "入門",
    hours: "50〜100時間",
    fee: "約15,000円",
    format: "選択式 / 60問 / 90分",
    english: "日本語対応",
    validity: "5年（更新要）",
    next: ["HTML5プロフェッショナル Lv.2"],
    description: "HTML/CSS/JavaScriptのフロントエンド技術を問う。Web系エンジニア必携。",
  },
  {
    name: "Ruby Association Certified Silver",
    category: "プログラミング",
    icon: "💎",
    tags: ["mid", "dev", "japanese"],
    level: "中級",
    hours: "100〜200時間",
    fee: "約26,000円",
    format: "選択式 / 50問 / 90分",
    english: "日本語対応",
    validity: "永続（更新不要）",
    next: ["Ruby Gold"],
    description: "まつもとゆきひろ氏公認のRuby資格。Ruby on Rails開発者に人気の実力証明。",
  },
  // Infrastructure
  {
    name: "LPIC-1 / LinuC Level 1",
    category: "インフラ",
    icon: "🐧",
    tags: ["mid", "infra", "japanese"],
    level: "中級",
    hours: "100〜200時間",
    fee: "約32,000円（2試験）",
    format: "選択式＋記述式 / 2試験構成",
    english: "日本語対応",
    validity: "5年（更新要）",
    next: ["LPIC-2"],
    description: "Linux基盤の定番資格。インフラエンジニア必携。LinuCは日本語で受験可能。",
  },
  {
    name: "HashiCorp Terraform Associate",
    category: "インフラ",
    icon: "🏗️",
    tags: ["mid", "infra", "cloud"],
    level: "中級",
    hours: "80〜150時間",
    fee: "約10,000円",
    format: "選択式・記述式 / 57問 / 60分",
    english: "英語必須",
    validity: "2年（再認定要）",
    next: [],
    description: "IaC（Infrastructure as Code）の定番ツールTerraformの公式資格。コスパ抜群。",
  },
  // Container
  {
    name: "Docker Certified Associate（DCA）",
    category: "コンテナ",
    icon: "🐳",
    tags: ["mid", "infra", "container", "dev"],
    level: "中級",
    hours: "100〜200時間",
    fee: "約20,000円",
    format: "選択式＋記述式 / 55問 / 90分",
    english: "英語必須",
    validity: "2年（再認定要）",
    next: ["CKA", "CKAD"],
    description: "コンテナ技術の基礎。Dockerを業務で使うエンジニア向けの実践的な国際資格。",
  },
  {
    name: "CKA（Certified Kubernetes Administrator）",
    category: "コンテナ",
    icon: "⚓",
    tags: ["senior", "infra", "container"],
    level: "上級",
    hours: "200〜300時間",
    fee: "約40,000円",
    format: "実技ハンズオン / 17問 / 120分",
    english: "英語必須",
    validity: "2年（再認定要）",
    next: ["CKS"],
    description: "Kubernetes管理の超実践型資格。実際にクラスタを操作して解答する本物の試験。",
  },
  {
    name: "CKAD（Certified Kubernetes Application Developer）",
    category: "コンテナ",
    icon: "🚢",
    tags: ["mid", "senior", "dev", "container"],
    level: "上級",
    hours: "150〜250時間",
    fee: "約40,000円",
    format: "実技ハンズオン / 19問 / 120分",
    english: "英語必須",
    validity: "2年（再認定要）",
    next: ["CKS"],
    description: "Kubernetesでのアプリ開発者向け実技資格。CKAとセットで取得する人も多い。",
  },
  {
    name: "CKS（Certified Kubernetes Security Specialist）",
    category: "コンテナ",
    icon: "⚓🔒",
    tags: ["senior", "container", "security"],
    level: "上級",
    hours: "200〜300時間",
    fee: "約40,000円",
    format: "実技ハンズオン / 15〜20問 / 120分",
    english: "英語必須",
    validity: "2年（再認定要）",
    next: [],
    description: "KubernetesセキュリティのCKA上位資格。CKA取得者のみ受験可能な難関。",
  },
];

// ==================== Scoring ====================
function calculateScores(answers: (AnswerOption | null)[], ownedNames: Set<string>): Qualification[] {
  const weights: TagWeights = {};
  for (const answer of answers) {
    if (!answer) continue;
    for (const [tag, value] of Object.entries(answer.tags)) {
      weights[tag] = (weights[tag] || 0) + value;
    }
  }

  const englishPenalty = weights["english_penalty"] || 0;

  // 保有資格の next から「おすすめ理由」マップを作成
  const ownedNextMap: Record<string, string[]> = {};
  for (const q of QUALIFICATIONS) {
    if (!ownedNames.has(q.name)) continue;
    for (const nextName of q.next) {
      if (!ownedNextMap[nextName]) ownedNextMap[nextName] = [];
      ownedNextMap[nextName].push(q.name);
    }
  }

  const scored = QUALIFICATIONS
    .filter((q) => !ownedNames.has(q.name)) // 保有済みを除外
    .map((q) => {
      let score = 0;
      for (const tag of q.tags) {
        const w = weights[tag];
        if (!w) continue;
        const multiplier =
          tag === "entry" || tag === "mid" || tag === "senior"
            ? 3
            : tag === "aws" || tag === "gcp" || tag === "azure"
            ? 3
            : tag === "security" || tag === "dev" || tag === "network" || tag === "db" || tag === "container"
            ? 2.5
            : 1.5;
        score += w * multiplier;
      }
      if (englishPenalty > 0 && q.english === "英語必須") {
        score -= englishPenalty * 2;
      }
      // 保有資格のnextに含まれる場合はスコアブースト
      const fromOwned = ownedNextMap[q.name];
      if (fromOwned) score += 12;
      return { ...q, score, fromOwned };
    });

  return scored.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 6);
}

// ==================== Helper Components ====================
const LEVEL_COLORS: Record<string, string> = {
  入門: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  中級: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  上級: "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

const RANK_STYLES = [
  { badge: "👑 イチオシ！", border: "border-yellow-400/50", glow: "shadow-yellow-500/20", bg: "from-yellow-600/15 to-amber-600/10" },
  { badge: "🥈 2位", border: "border-slate-400/40", glow: "shadow-slate-500/10", bg: "from-slate-600/15 to-slate-700/10" },
  { badge: "🥉 3位", border: "border-amber-600/40", glow: "shadow-amber-700/10", bg: "from-amber-700/15 to-orange-800/10" },
  { badge: "4位", border: "border-white/15", glow: "", bg: "from-white/5 to-white/3" },
  { badge: "5位", border: "border-white/10", glow: "", bg: "from-white/3 to-transparent" },
];

function ResultCard({ q, rank }: { q: Qualification; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 0);
  const style = RANK_STYLES[rank];
  const hasOwnedBoost = q.fromOwned && q.fromOwned.length > 0;

  return (
    <div
      className={`bg-gradient-to-br ${style.bg} backdrop-blur-xl border ${style.border} rounded-2xl overflow-hidden shadow-xl ${style.glow ? `shadow-xl ${style.glow}` : ""} transition-all duration-300`}
    >
      {/* Header */}
      <button
        className="w-full text-left p-5 flex items-start gap-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="text-3xl mt-0.5 shrink-0">{q.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full border ${rank === 0 ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" : "bg-white/10 text-white/50 border-white/15"}`}>
              {style.badge}
            </span>
            {hasOwnedBoost && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-rose-500/20 text-rose-300 border-rose-500/40">
                🔗 保有資格からのステップアップ
              </span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[q.level]}`}>
              {q.level}
            </span>
            <span className="text-[10px] text-indigo-400/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {q.category}
            </span>
          </div>
          <p className="text-white font-black text-base leading-tight">{q.name}</p>
          <p className="text-indigo-300/70 text-xs mt-1 leading-relaxed">{q.description}</p>
        </div>
        <div className="text-indigo-400/50 text-sm shrink-0 mt-1">
          {expanded ? "▲" : "▼"}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/8 pt-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "⏱ 学習目安", val: q.hours },
              { label: "💴 受験費用", val: q.fee },
              { label: "📝 試験形式", val: q.format },
              { label: "🌍 英語", val: q.english },
              { label: "📅 有効期限", val: q.validity },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white/5 border border-white/8 rounded-xl p-3">
                <p className="text-[9px] text-indigo-400/50 font-bold tracking-widest uppercase mb-1">{label}</p>
                <p className="text-xs text-indigo-100/85 font-semibold leading-snug">{val}</p>
              </div>
            ))}
          </div>

          {/* Owned Boost Reason */}
          {hasOwnedBoost && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
              <p className="text-[9px] text-rose-400/70 font-bold tracking-widest uppercase mb-2">🔗 おすすめ理由</p>
              <p className="text-xs text-rose-200/80 leading-relaxed">
                {q.fromOwned!.join("・")} を持っているあなたの次のステップとして最適です！
              </p>
            </div>
          )}

          {/* Next Step */}
          {q.next.length > 0 && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
              <p className="text-[9px] text-indigo-400/60 font-bold tracking-widest uppercase mb-2">🚀 次に目指せる資格</p>
              <div className="flex flex-wrap gap-1.5">
                {q.next.map((n) => (
                  <span key={n} className="text-[11px] bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 px-2.5 py-1 rounded-full font-bold">
                    → {n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== Main Component ====================
// カテゴリ一覧（保有資格選択画面用）
const CATEGORIES = Array.from(new Set(QUALIFICATIONS.map((q) => q.category)));

export default function QuizPage() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(AnswerOption | null)[]>(Array(QUESTIONS.length).fill(null));
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<"owned" | "quiz" | "result">("owned");
  const [animating, setAnimating] = useState(false);
  const [ownedNames, setOwnedNames] = useState<Set<string>>(new Set());

  const question = QUESTIONS[currentQ];
  const progress = ((currentQ + (selectedIdx !== null ? 0.5 : 0)) / QUESTIONS.length) * 100;
  const results = phase === "result" ? calculateScores(answers, ownedNames) : [];

  const toggleOwned = (name: string) => {
    setOwnedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAnswer = (idx: number) => {
    if (animating) return;
    setSelectedIdx(idx);
  };

  const goNext = () => {
    if (selectedIdx === null || animating) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = QUESTIONS[currentQ].answers[selectedIdx];
    setAnswers(newAnswers);
    setAnimating(true);

    setTimeout(() => {
      if (currentQ + 1 >= QUESTIONS.length) {
        setPhase("result");
      } else {
        setCurrentQ((q) => q + 1);
        setSelectedIdx(null);
      }
      setAnimating(false);
    }, 300);
  };

  const restart = () => {
    setCurrentQ(0);
    setAnswers(Array(QUESTIONS.length).fill(null));
    setSelectedIdx(null);
    setPhase("owned");
    setOwnedNames(new Set());
    setAnimating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative">
      {/* Background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto p-5 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
          >
            ← ホームに戻る
          </Link>
          {phase === "owned" && (
            <span className="text-[10px] text-indigo-400/50 font-bold tracking-widest uppercase">
              {ownedNames.size > 0 ? `${ownedNames.size}件選択中` : "保有資格を選択"}
            </span>
          )}
          {phase === "quiz" && (
            <span className="text-[10px] text-indigo-400/50 font-bold tracking-widest uppercase">
              {currentQ + 1} / {QUESTIONS.length}
            </span>
          )}
          {phase === "result" && (
            <button
              onClick={restart}
              className="text-xs font-bold text-indigo-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
            >
              もう一度診断
            </button>
          )}
        </div>

        {/* ===== 保有資格選択フェーズ ===== */}
        {phase === "owned" && (
          <div>
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🎓</div>
              <p className="text-[10px] text-indigo-400/50 font-bold tracking-[0.3em] uppercase mb-2">STEP 1 / 2</p>
              <h1 className="text-2xl font-black text-white">すでに持っている資格は？</h1>
              <p className="text-indigo-300/60 text-sm mt-1">選択した資格は除外し、次のステップをおすすめします</p>
            </div>

            <div className="space-y-4 mb-8">
              {CATEGORIES.map((cat) => {
                const items = QUALIFICATIONS.filter((q) => q.category === cat);
                return (
                  <div key={cat} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-white/5 border-b border-white/8">
                      <p className="text-[10px] font-black text-indigo-300/70 tracking-widest uppercase">{cat}</p>
                    </div>
                    <div className="p-3 space-y-1">
                      {items.map((q) => {
                        const checked = ownedNames.has(q.name);
                        return (
                          <button
                            key={q.name}
                            onClick={() => toggleOwned(q.name)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                              checked
                                ? "bg-indigo-500/20 border border-indigo-400/40"
                                : "bg-white/3 border border-transparent hover:bg-white/8"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                              checked ? "bg-indigo-500 border-indigo-400" : "border-white/25"
                            }`}>
                              {checked && <span className="text-white text-[11px] font-black">✓</span>}
                            </div>
                            <span className="text-lg shrink-0">{q.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold leading-tight ${checked ? "text-white" : "text-indigo-100/75"}`}>
                                {q.name}
                              </p>
                              <p className="text-[10px] text-indigo-400/50 mt-0.5">{q.level} · {q.hours}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setPhase("quiz")}
                className="w-full py-4 rounded-2xl font-black text-base bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all"
              >
                {ownedNames.size > 0 ? `${ownedNames.size}件選択して診断スタート →` : "持っている資格はない → 診断スタート"}
              </button>
            </div>
          </div>
        )}

        {phase === "quiz" && (
          <>
            {/* Title */}
            <div className="text-center mb-8">
              <p className="text-[10px] text-indigo-400/50 font-bold tracking-[0.3em] uppercase mb-2">SHIKAKU FINDER</p>
              <h1 className="text-2xl font-black text-white">あなたにぴったりの資格は？</h1>
              <p className="text-indigo-300/60 text-sm mt-1">7問に答えて、最適な資格を見つけよう</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                {QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < currentQ
                        ? "bg-indigo-400"
                        : i === currentQ
                        ? "bg-violet-400 scale-125"
                        : "bg-white/15"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question Card */}
            <div
              className={`transition-all duration-300 ${animating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}
            >
              <div className="bg-white/8 border border-white/15 rounded-3xl p-7 mb-6 shadow-2xl text-center">
                <div className="text-5xl mb-4">{question.emoji}</div>
                <h2 className="text-xl font-black text-white mb-1">{question.text}</h2>
                {question.sub && (
                  <p className="text-indigo-400/60 text-xs">{question.sub}</p>
                )}
              </div>

              {/* Answer Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {question.answers.map((answer, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(idx)}
                    className={`relative p-4 rounded-2xl border text-left transition-all duration-200 active:scale-95 ${
                      selectedIdx === idx
                        ? "bg-gradient-to-br from-indigo-500/30 to-violet-500/20 border-indigo-400/60 shadow-lg shadow-indigo-500/20 scale-[1.03]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
                    }`}
                  >
                    {selectedIdx === idx && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-black">✓</span>
                      </div>
                    )}
                    <div className="text-2xl mb-2">{answer.emoji}</div>
                    <p className={`text-sm font-bold leading-snug ${selectedIdx === idx ? "text-white" : "text-indigo-100/80"}`}>
                      {answer.text}
                    </p>
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={goNext}
                disabled={selectedIdx === null}
                className={`w-full py-4 rounded-2xl font-black text-base transition-all duration-300 ${
                  selectedIdx !== null
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-violet-500 active:scale-98"
                    : "bg-white/5 text-white/20 cursor-not-allowed border border-white/8"
                }`}
              >
                {currentQ + 1 === QUESTIONS.length ? "結果を見る 🎉" : "次の質問へ →"}
              </button>
            </div>
          </>
        )}

        {phase === "result" && (
          <div className={`transition-all duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
            {/* Result Header */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🎊</div>
              <p className="text-[10px] text-indigo-400/50 font-bold tracking-[0.3em] uppercase mb-2">診断結果</p>
              <h2 className="text-2xl font-black text-white mb-1">あなたにおすすめの資格</h2>
              <p className="text-indigo-300/60 text-sm">
                {ownedNames.size > 0 ? `保有${ownedNames.size}件を除いて` : "回答をもとに"} {results.length} 件ピックアップしました
              </p>
            </div>

            {/* Result Cards */}
            <div className="space-y-4">
              {results.map((q, i) => (
                <ResultCard key={q.name} q={q} rank={i} />
              ))}
            </div>

            {/* Restart */}
            <div className="text-center mt-8 space-y-3">
              <button
                onClick={restart}
                className="w-full py-4 rounded-2xl font-black text-base bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-violet-500 active:scale-98 transition-all"
              >
                もう一度診断する 🔄
              </button>
              <Link
                href="/"
                className="block w-full py-3 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-indigo-300 hover:bg-white/10 transition-all text-center"
              >
                ← ホームに戻る
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
