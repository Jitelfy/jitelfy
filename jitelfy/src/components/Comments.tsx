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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const commentData = { text: newCommentText };

    const res = await fetch(`${BASE_URL}/posts/comments?parent=${parentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(commentData),
    });
  };
  
  // Delete a comment by id
  const handleDeleteComment = async (commentId: string) => {
    const response = await fetch(`${BASE_URL}/posts?id=${commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    // Remove the deleted comment from state
    setComments((prev) => prev.filter((c) => c.post.id !== commentId));
}
  return null;
};

export default Comments;
