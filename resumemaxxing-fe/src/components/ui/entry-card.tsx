import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import PillBtn from "@/components/ui/pill-btn";

const EntryCard = ({
    children, onEdit, onDelete, expanded, onToggle,
  }: {
    children: React.ReactNode; onEdit: () => void; onDelete: () => void;
    expanded: boolean; onToggle: () => void;
  }) => (
    <div className="border border-[#1a3050] rounded-lg overflow-hidden bg-[#08132a]">
      <div
        className="flex items-start justify-between px-4 py-3 cursor-pointer hover:bg-[#0c1a38] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">{children}</div>
        <div className="flex items-center gap-1 ml-3 shrink-0" onClick={e => e.stopPropagation()}>
          <PillBtn variant="ghost" onClick={onEdit}><Pencil size={11} /></PillBtn>
          <PillBtn variant="danger" onClick={onDelete}><Trash2 size={11} /></PillBtn>
          <span className="text-[#4a7090] ml-1">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        </div>
      </div>
    </div>
  )

export default EntryCard