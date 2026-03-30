/**
 * File Icon Configuration - 使用 Lucide React 图标库
 * 根据 Railway 规范优化
 */
import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  Terminal,
  Settings,
  FileCode,
  Table,
  Database,
  Shield,
  FileKey,
  Lock,
  Disc,
  HardDrive,
  FileText,
  ScrollText,
  File,
  Folder,
  FolderOpen,
  Video,
  Music,
  Type,
  Wrench,
  Layers,
  Clock,
  Link2,
} from 'lucide-react';

// ============================================
// Color system - Railway 风格配色
// ============================================
export const colors = {
  // Purple - Primary, directory, source code
  blue: '#8B5CF6',
  // Teal - Executable/script, structured data
  teal: '#14B8A6',
  // Orange - Compressed/archive
  orange: '#F97316',
  // Amber - Config file
  amber: '#F59E0B',
  // Purple - Document type
  purple: '#A855F7',
  // Pink - Key/certificate
  pink: '#EC4899',
  // Gray - Regular file, image, media
  gray: '#71717A',
  // Red - Delete/error
  red: '#EF4444',
};

// ============================================
// Icon config interface
// ============================================
export interface IconConfig {
  icon: LucideIcon;  // Lucide React 图标组件
  color: string;
  opacity?: number;
}

// ============================================
// Compound extension mapping (higher priority)
// ============================================
export const COMPOUND_EXTS: Record<string, IconConfig> = {
  'tar.gz': { icon: Archive, color: colors.orange },
  'tar.bz2': { icon: Archive, color: colors.orange },
  'tar.xz': { icon: Archive, color: colors.orange },
  'tar.zst': { icon: Archive, color: colors.orange },
};

// ============================================
// Extension mapping
// ============================================
export const EXT_MAP: Record<string, IconConfig> = {
  // ========== Compressed archives ==========
  tar: { icon: Archive, color: colors.orange },
  gz: { icon: Archive, color: colors.orange },
  tgz: { icon: Archive, color: colors.orange },
  bz2: { icon: Archive, color: colors.orange },
  tbz2: { icon: Archive, color: colors.orange },
  xz: { icon: Archive, color: colors.orange },
  txz: { icon: Archive, color: colors.orange },
  zst: { icon: Archive, color: colors.orange },
  zip: { icon: Archive, color: colors.orange },
  rar: { icon: Archive, color: colors.orange },
  '7z': { icon: Archive, color: colors.orange },
  deb: { icon: Archive, color: colors.orange },
  rpm: { icon: Archive, color: colors.orange },
  apk: { icon: Archive, color: colors.orange },
  snap: { icon: Archive, color: colors.orange },
  flatpak: { icon: Archive, color: colors.orange },
  jar: { icon: Archive, color: colors.orange },
  war: { icon: Archive, color: colors.orange },
  ear: { icon: Archive, color: colors.orange },

  // ========== Executable/script ==========
  sh: { icon: Terminal, color: colors.teal },
  bash: { icon: Terminal, color: colors.teal },
  zsh: { icon: Terminal, color: colors.teal },
  fish: { icon: Terminal, color: colors.teal },
  py: { icon: Terminal, color: colors.teal },
  rb: { icon: Terminal, color: colors.teal },
  pl: { icon: Terminal, color: colors.teal },
  php: { icon: Terminal, color: colors.teal },
  js: { icon: Terminal, color: colors.teal },
  bin: { icon: Terminal, color: colors.teal },
  run: { icon: Terminal, color: colors.teal },
  out: { icon: Terminal, color: colors.teal },
  elf: { icon: Terminal, color: colors.teal },
  app: { icon: Terminal, color: colors.teal },

  // ========== Config files ==========
  conf: { icon: Settings, color: colors.amber },
  config: { icon: Settings, color: colors.amber },
  cfg: { icon: Settings, color: colors.amber },
  ini: { icon: Settings, color: colors.amber },
  env: { icon: Settings, color: colors.amber },
  yaml: { icon: Settings, color: colors.amber },
  yml: { icon: Settings, color: colors.amber },
  toml: { icon: Settings, color: colors.amber },
  properties: { icon: Settings, color: colors.amber },

  // ========== Structured data ==========
  json: { icon: FileCode, color: colors.teal },
  json5: { icon: FileCode, color: colors.teal },
  xml: { icon: FileCode, color: colors.teal },
  html: { icon: FileCode, color: colors.teal },
  htm: { icon: FileCode, color: colors.teal },
  csv: { icon: Table, color: colors.teal },
  tsv: { icon: Table, color: colors.teal },
  parquet: { icon: Table, color: colors.teal },
  avro: { icon: Table, color: colors.teal },
  proto: { icon: FileCode, color: colors.teal },
  graphql: { icon: FileCode, color: colors.teal },
  gql: { icon: FileCode, color: colors.teal },

  // ========== Database ==========
  db: { icon: Database, color: colors.teal },
  sqlite: { icon: Database, color: colors.teal },
  sqlite3: { icon: Database, color: colors.teal },
  mdb: { icon: Database, color: colors.teal },
  accdb: { icon: Database, color: colors.teal },
  sql: { icon: Database, color: colors.teal },
  bak: { icon: Database, color: colors.teal },

  // ========== Key/certificate ==========
  pem: { icon: Shield, color: colors.pink },
  key: { icon: FileKey, color: colors.pink },
  privkey: { icon: FileKey, color: colors.pink },
  pub: { icon: FileKey, color: colors.pink },
  crt: { icon: Shield, color: colors.pink },
  cer: { icon: Shield, color: colors.pink },
  csr: { icon: Shield, color: colors.pink },
  p12: { icon: Shield, color: colors.pink },
  pfx: { icon: Shield, color: colors.pink },
  jks: { icon: Shield, color: colors.pink },
  gpg: { icon: Lock, color: colors.pink },
  pgp: { icon: Lock, color: colors.pink },

  // ========== Image/Disk ==========
  iso: { icon: Disc, color: colors.purple },
  img: { icon: HardDrive, color: colors.purple },
  vhd: { icon: HardDrive, color: colors.purple },
  vhdx: { icon: HardDrive, color: colors.purple },
  vmdk: { icon: HardDrive, color: colors.purple },
  qcow2: { icon: HardDrive, color: colors.purple },
  qcow: { icon: HardDrive, color: colors.purple },
  raw: { icon: HardDrive, color: colors.purple },

  // ========== Documents ==========
  md: { icon: FileText, color: colors.purple },
  markdown: { icon: FileText, color: colors.purple },
  txt: { icon: FileText, color: colors.purple },
  rst: { icon: FileText, color: colors.purple },
  adoc: { icon: FileText, color: colors.purple },
  pdf: { icon: FileText, color: colors.purple },
  doc: { icon: FileText, color: colors.purple },
  docx: { icon: FileText, color: colors.purple },

  // ========== Logs ==========
  log: { icon: ScrollText, color: colors.amber },
  trace: { icon: ScrollText, color: colors.amber },

  // ========== Source code ==========
  c: { icon: FileCode, color: colors.blue },
  h: { icon: FileCode, color: colors.blue },
  cpp: { icon: FileCode, color: colors.blue },
  cc: { icon: FileCode, color: colors.blue },
  hpp: { icon: FileCode, color: colors.blue },
  go: { icon: FileCode, color: colors.blue },
  rs: { icon: FileCode, color: colors.blue },
  java: { icon: FileCode, color: colors.blue },
  kt: { icon: FileCode, color: colors.blue },
  kts: { icon: FileCode, color: colors.blue },
  ts: { icon: FileCode, color: colors.blue },
  tsx: { icon: FileCode, color: colors.blue },
  jsx: { icon: FileCode, color: colors.blue },
  vue: { icon: FileCode, color: colors.blue },
  svelte: { icon: FileCode, color: colors.blue },
  scss: { icon: FileCode, color: colors.blue },
  sass: { icon: FileCode, color: colors.blue },
  less: { icon: FileCode, color: colors.blue },
  lua: { icon: FileCode, color: colors.blue },
  awk: { icon: FileCode, color: colors.blue },
  ps1: { icon: FileCode, color: colors.blue },
  cs: { icon: FileCode, color: colors.blue },

  // ========== Image ==========
  png: { icon: File, color: colors.gray },
  jpg: { icon: File, color: colors.gray },
  jpeg: { icon: File, color: colors.gray },
  gif: { icon: File, color: colors.gray },
  webp: { icon: File, color: colors.gray },
  svg: { icon: File, color: colors.gray },
  bmp: { icon: File, color: colors.gray },
  tiff: { icon: File, color: colors.gray },
  heic: { icon: File, color: colors.gray },
  cr2: { icon: File, color: colors.gray },
  nef: { icon: File, color: colors.gray },
  arw: { icon: File, color: colors.gray },
  dng: { icon: File, color: colors.gray },
  ico: { icon: File, color: colors.gray },

  // ========== Video ==========
  mp4: { icon: Video, color: colors.gray },
  avi: { icon: Video, color: colors.gray },
  mkv: { icon: Video, color: colors.gray },
  mov: { icon: Video, color: colors.gray },
  wmv: { icon: Video, color: colors.gray },
  flv: { icon: Video, color: colors.gray },
  webm: { icon: Video, color: colors.gray },
  m4v: { icon: Video, color: colors.gray },
  mpg: { icon: Video, color: colors.gray },
  mpeg: { icon: Video, color: colors.gray },
  '3gp': { icon: Video, color: colors.gray },

  // ========== Audio ==========
  mp3: { icon: Music, color: colors.gray },
  flac: { icon: Music, color: colors.gray },
  aac: { icon: Music, color: colors.gray },
  ogg: { icon: Music, color: colors.gray },
  m4a: { icon: Music, color: colors.gray },
  wav: { icon: Music, color: colors.gray },
  aiff: { icon: Music, color: colors.gray },
  opus: { icon: Music, color: colors.gray },

  // ========== Font ==========
  ttf: { icon: Type, color: colors.gray },
  otf: { icon: Type, color: colors.gray },
  woff: { icon: Type, color: colors.gray },
  woff2: { icon: Type, color: colors.gray },
};

// ============================================
// Special filename mapping (highest priority)
// ============================================
export const FILENAME_MAP: Record<string, IconConfig> = {
  // Build scripts
  Makefile: { icon: Wrench, color: colors.teal },
  makefile: { icon: Wrench, color: colors.teal },
  'GNUmakefile': { icon: Wrench, color: colors.teal },
  // Docker
  Dockerfile: { icon: Layers, color: colors.teal },
  'docker-compose.yml': { icon: Layers, color: colors.teal },
  'docker-compose.yaml': { icon: Layers, color: colors.teal },
  // Shell config
  '.bashrc': { icon: Settings, color: colors.amber },
  '.zshrc': { icon: Settings, color: colors.amber },
  '.profile': { icon: Settings, color: colors.amber },
  '.bash_profile': { icon: Settings, color: colors.amber },
  '.zprofile': { icon: Settings, color: colors.amber },
  // Editor config
  '.vimrc': { icon: Settings, color: colors.amber },
  '.nvimrc': { icon: Settings, color: colors.amber },
  '.editorconfig': { icon: Settings, color: colors.amber },
  '.gitignore': { icon: Settings, color: colors.amber },
  '.gitattributes': { icon: Settings, color: colors.amber },
  // Cron
  crontab: { icon: Clock, color: colors.amber },
  // Auth
  authorized_keys: { icon: Shield, color: colors.pink },
  known_hosts: { icon: Shield, color: colors.pink },
  config: { icon: Settings, color: colors.pink },
  // SSH keys
  id_rsa: { icon: FileKey, color: colors.pink },
  id_ed25519: { icon: FileKey, color: colors.pink },
  id_dsa: { icon: FileKey, color: colors.pink },
  id_ecdsa: { icon: FileKey, color: colors.pink },
  'id_rsa.pub': { icon: FileKey, color: colors.pink },
  'id_ed25519.pub': { icon: FileKey, color: colors.pink },
  'id_dsa.pub': { icon: FileKey, color: colors.pink },
  'id_ecdsa.pub': { icon: FileKey, color: colors.pink },
};

// ============================================
// Export icon components for direct use
// ============================================
export const iconComponents = {
  Folder,
  FolderOpen,
  File,
  FileText,
  Terminal,
  Link2,
};