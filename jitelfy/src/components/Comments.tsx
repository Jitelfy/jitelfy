import React, { useEffect, useState } from "react";
import { PackagedPost } from "../types";
import { BASE_URL } from "../api";

interface CommentsProps {
  parentId: string;
}

const Comments: React.FC<CommentsProps> = ({ parentId }) => {
  const [comments, setComments] = useState<PackagedPost[]>([]);
  const [newCommentText, setNewCommentText] = useState("");

  // Fetch replies for a root post
  const fetchComments = async () => {
    const res = await fetch(`${BASE_URL}/posts/comments?parent=${parentId}`, {
      credentials: "include",
    });
    const data = await res.json();
    // Sort comments by time
    data.sort(
      (a: PackagedPost, b: PackagedPost) =>
        new Date(b.post.time).getTime() - new Date(a.post.time).getTime()
    );
    setComments(data);
  };

  useEffect(() => {
    fetchComments();
  }, [parentId]);

  
  return null;
};

export default Comments;
