import React, { useEffect, useState, useContext } from "react";
import { PackagedPost } from "../types";
import { BASE_URL } from "../api";
import { UserContext } from "../UserContext";
import { IconArray } from "../UserContext";
import { Link, useSearchParams } from "react-router-dom";

interface CommentsProps {
  parentId: string;
}

const Comments: React.FC<CommentsProps> = ({ parentId }) => {
  const [comments, setComments] = useState<PackagedPost[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentSong, setNewCommentSong] = useState("");
  const { user } = useContext(UserContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFlairClick = (flair: string) => {
    setSearchParams({ flair });
  };

  const renderTextWithHashtags = (text: string) => {
    return text.split(" ").map((word, index) => {
      if (word.startsWith("#") && word.length > 1) {
        const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_~()]/g, "");
        return (
          <span
            key={index}
            className="cursor-pointer text-accent-blue hover:underline"
            onClick={() => handleFlairClick(cleanWord.replace(/^#/, ""))}
          >
            {word}{" "}
          </span>
        );
      }
      return <span key={index}>{word} </span>;
    });
  };

  const fetchComments = async () => {
    const res = await fetch(`${BASE_URL}/posts/comments?parent=${parentId}`, {
      credentials: "include",
    });
    const data = await res.json();
    data.sort(
      (a: PackagedPost, b: PackagedPost) =>
        new Date(b.post.time).getTime() - new Date(a.post.time).getTime()
    );
    setComments(data);
  };

  useEffect(() => {
    fetchComments();
  }, [parentId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const commentData = {
      userid: user.id,
      text: newCommentText,
      parent: parentId,
      song: newCommentSong,
    };

    const res = await fetch(`${BASE_URL}/posts/comments?parent=${parentId}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + user.token,
      },
      credentials: "include",
      body: JSON.stringify(commentData),
    });

    if (res.ok) {
      const newComment = await res.json();
      setComments((prev) => [
        { post: newComment, user: user },
        ...prev,
      ]);
      setNewCommentText("");
      setNewCommentSong("");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await fetch(`${BASE_URL}/posts?id=${commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    setComments((prev) => prev.filter((c) => c.post.id !== commentId));
  };

  return (
    <div className="mt-4 ml-8 bg-backgorund-main border-l-2 border-text-secondary pl-4">
      {comments.map((comment) => (
        <div
          key={comment.post.id}
          className="relative bg-background-secondary p-4 rounded-lg mb-4"
        >

          {/* Delete Button (only for our own posts)*/}
          {user != null && comment.user.id === user.id && (
          <button
            onClick={() => handleDeleteComment(comment.post.id)}
            className="absolute top-2 right-2 hover:cursor-pointer"
          >
            <svg
              width="25px"
              height="25px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 5.29289Z"
                fill="#7e7e7e"
              />
            </svg>
          </button>)}

          <div className="flex items-center">
            <img
              className="size-12 rounded-full mb-2 mr-3"
              src={IconArray[comment.user.icon]}
              alt={comment.user.displayname}
            />
            <div>
              <Link to={`/profile/${comment.user.username}`} className="hover:underline decoration-text-secondary">
                <p className="text-text-main font-bold">{comment.user.displayname}</p>
                <p className="text-text-secondary">@{comment.user.username}</p>
              </Link>
              <p className="text-text-secondary text-sm">
                {new Date(comment.post.time).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-2 text-text-main whitespace-pre-wrap break-words mb-2">
            {renderTextWithHashtags(comment.post.text)}
          </p>
          <div className="post-details">
            {comment.post.embed && (
              <img
                src={comment.post.embed}
                className="w-full h-40 rounded-md"
                alt="embedded content"
              />
            )}
            {comment.post.song && (
              <div className="mt-2">
                <iframe
                  src={comment.post.song}
                  className="w-full h-20"
                  title={`Song for comment ${comment.post.id}`}
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Comment creation form */}
      {user && (
        <div className="bg-background-secondary p-4 rounded-lg mt-4">
          <div className="flex flex-row mb-1">
            <img
              className="size-14 rounded-full mr-3"
              src={IconArray[user.icon]}
              alt={user.displayname}
            />
            <div className="flex flex-col w-full items-center justify-end gap-3">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="What's on your mind?"
                className="resize-none whitespace-pre-wrap bg-background-main w-full mt-1 text-text-main rounded-lg border border-background-tertiary p-2 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                rows={3}
              ></textarea>
              <input
                type="url"
                value={newCommentSong}
                onChange={(e) => setNewCommentSong(e.target.value)}
                placeholder="Enter a song link..."
                className="bg-background-main text-text-main w-full rounded-lg border border-background-tertiary p-2 focus:outline-none focus:ring-2 focus:ring-accent-blue"
              />
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmitComment}
              className="bg-accent-blue-light text-text-main px-4 py-2 rounded hover:bg-accent-blue"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments;
