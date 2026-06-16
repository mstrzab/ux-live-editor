"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import BlockEditor from "@/components/BlockEditor";

interface Channel {
  id: string;
  name: string;
  telegramId: string;
}

interface Post {
  id: string;
  title?: string;
  content: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  channel: Channel;
  versions?: { id: string; content: string; versionNumber: number; createdAt: string }[];
}

export default function EditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session && params.id) {
      Promise.all([
        fetch(`/api/posts/${params.id}`).then((r) => r.json()),
        fetch("/api/channels").then((r) => r.json()),
      ]).then(([postData, channelsData]) => {
        setPost(postData);
        setChannels(channelsData);
        setLoading(false);
      });
    }
  }, [session, params.id]);

  if (loading || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Загрузка...
      </div>
    );
  }

  return <BlockEditor post={post} channels={channels} />;
}
