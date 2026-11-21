import { ActionFolder, ActionItem, MONTHS_PT } from './types';

export function getFolderChildren(folders: ActionFolder[], parentId: string | null): ActionFolder[] {
  return folders.filter((f) => f.parent_folder_id === parentId);
}

export function getFolderPath(folders: ActionFolder[], folderId: string): ActionFolder[] {
  const path: ActionFolder[] = [];
  const visited = new Set<string>();
  let curr = folders.find((f) => f.id === folderId);
  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    path.unshift(curr);
    curr = curr.parent_folder_id ? folders.find((f) => f.id === curr!.parent_folder_id) : undefined;
  }
  return path;
}

export function getFolderPathLabel(folders: ActionFolder[], folderId: string): string {
  const path = getFolderPath(folders, folderId);
  return path.map((f) => f.name).join(' > ');
}

export function getDescendantFolderIds(folders: ActionFolder[], rootId: string): string[] {
  const result: string[] = [rootId];
  const queue: string[] = [rootId];
  const visited = new Set<string>([rootId]);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = folders.filter((f) => f.parent_folder_id === currentId);
    for (const child of children) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        result.push(child.id);
        queue.push(child.id);
      }
    }
  }
  return result;
}

export function flattenFoldersWithDepth(
  folders: ActionFolder[],
  parentId: string | null = null,
  depth = 0
): { folder: ActionFolder; depth: number; pathLabel: string }[] {
  const children = folders.filter((f) => f.parent_folder_id === parentId);
  const out: { folder: ActionFolder; depth: number; pathLabel: string }[] = [];
  for (const child of children) {
    out.push({
      folder: child,
      depth,
      pathLabel: getFolderPathLabel(folders, child.id),
    });
    out.push(...flattenFoldersWithDepth(folders, child.id, depth + 1));
  }
  return out;
}

export function toIsoDate(year: number, monthIdx: number, day: number): string {
  const m = String(monthIdx + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  return new Date(y || 2026, (m || 11) - 1, d || 21, 12, 0, 0);
}

export function dateToIso(date: Date): string {
  return toIsoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDaysIso(iso: string, delta: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + delta);
  return dateToIso(d);
}

export function getWeekDatesFromIso(iso: string): string[] {
  const d = parseIsoDate(iso);
  const sundayOffset = d.getDay(); // 0 = DOM
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - sundayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const cur = new Date(sunday);
    cur.setDate(sunday.getDate() + i);
    return dateToIso(cur);
  });
}

const JS_DAY_TO_WEEKDAY_TAG = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'] as const;

export function doesActionOccurOnDate(action: ActionItem, isoDate: string): boolean {
  if (action.due_date === isoDate) return true;

  const d = parseIsoDate(isoDate);
  const dayNum = d.getDate();
  const weekdayTag = JS_DAY_TO_WEEKDAY_TAG[d.getDay()];
  const f = action.frequency;
  if (!f) return false;

  if (f.semanalDays.includes('TODOS OS DIAS')) return true;
  if (f.semanalDays.includes(weekdayTag)) return true;
  if (f.mensalDays.includes(`DIA ${dayNum}`)) return true;
  if (f.diariaTimes.length > 0 && f.semanalDays.length === 0 && f.mensalDays.length === 0) {
    return true;
  }
  return false;
}

export function getMonthMatrix(year: number, monthIdx: number): (number | null)[] {
  const firstDay = new Date(year, monthIdx, 1).getDay(); // 0 = DOM
  const daysInMonth =
    monthIdx === 1 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
      ? 29
      : MONTHS_PT[monthIdx]?.days ?? 30;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export function formatShortPtBrDate(isoDate: string): string {
  const [, m, d] = isoDate.split('-');
  const monthIdx = Math.max(0, Math.min(11, parseInt(m ?? '11', 10) - 1));
  const monthShort = MONTHS_PT[monthIdx]?.short ?? 'NOV';
  return `${d} ${monthShort}`;
}
