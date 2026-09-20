import { useQuery } from "@tanstack/react-query";
import { CrudPage } from "../../features/admin/CrudPage";
import { PageHeader } from "../../features/admin/PageHeader";
import { adminService } from "../../services/admin";
import type { Faq } from "../../types";
import { Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { formatDateTime } from "../../lib/utils";

export default function AdminFaqs() {
  const unansweredQ = useQuery({
    queryKey: ["admin", "unanswered"],
    queryFn: () => adminService.unansweredQuestions(),
  });

  return (
    <div>
      <PageHeader
        title="FAQs & Chatbot"
        description="Public FAQs power both the FAQ section and the assistant chatbot. Questions the bot cannot answer are logged below."
      />

      <section className="mb-10">
        <h2 className="mb-3 font-display text-base font-bold text-navy">Recent unanswered questions</h2>
        {unansweredQ.isLoading ? (
          <LoadingState />
        ) : unansweredQ.isError ? (
          <ErrorState onRetry={() => unansweredQ.refetch()} />
        ) : !unansweredQ.data || unansweredQ.data.length === 0 ? (
          <EmptyState compact title="No unanswered questions" hint="When the assistant cannot answer, the question is logged here so you can add an FAQ." />
        ) : (
          <ul className="divide-y divide-lightgray rounded-xl border border-lightgray bg-white shadow-card">
            {unansweredQ.data.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm text-ink">{q.question}</span>
                <span className="shrink-0 text-xs text-muted">{formatDateTime(q.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CrudPage<Faq>
        title="FAQ entries"
        entityName="FAQ"
        queryKey={["admin", "faqs"]}
        fetcher={() => adminService.faqs()}
        searchKeys={["question", "category"]}
        toPayload={(v, editing) => ({
          ...(editing ? { id: editing.id } : {}),
          question: String(v.question ?? "").trim(),
          answer: String(v.answer ?? "").trim(),
          category: v.category || null,
          featured: Boolean(v.featured),
          status: v.status || "draft",
          display_order: Number(v.display_order ?? 0),
        })}
        upsert={(payload) => adminService.upsertFaq(payload)}
        remove={(id) => adminService.deleteFaq(id)}
        columns={[
          { key: "q", header: "Question", render: (f) => <span className="font-semibold text-navy">{f.question}</span> },
          { key: "cat", header: "Category", render: (f) => f.category ?? "—" },
          { key: "feat", header: "Featured", render: (f) => (f.featured ? <Badge tone="saffron">Featured</Badge> : "—") },
          {
            key: "status",
            header: "Status",
            render: (f) => (
              <Badge tone={f.status === "published" ? "green" : f.status === "draft" ? "gray" : "red"}>{f.status}</Badge>
            ),
          },
        ]}
        fields={[
          { name: "question", label: "Question", required: true, colSpan: 2 },
          { name: "answer", label: "Answer", type: "textarea", required: true, colSpan: 2 },
          { name: "category", label: "Category", placeholder: "e.g. Admissions, Fees, Batches" },
          { name: "display_order", label: "Display order", type: "number" },
          { name: "featured", label: "Featured", type: "checkbox" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ],
          },
        ]}
      />
    </div>
  );
}
