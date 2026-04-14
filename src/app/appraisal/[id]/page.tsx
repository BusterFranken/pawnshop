export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ChatContainer } from "@/components/chat/chat-container";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AppraisalChatPage({ params }: Props) {
  const { id } = await params;

  const appraisal = await db.appraisal.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!appraisal) {
    notFound();
  }

  return (
    <div className="h-full">
      <ChatContainer appraisal={appraisal} />
    </div>
  );
}
