import React, { useEffect, useState, useContext } from "react";
import {PackagedPost, Post, User} from "../types";
import { BASE_URL } from "../api";
import { UserContext } from "../UserContext";
import { IconArray } from "../UserContext";
import { useSearchParams } from "react-router-dom";
import * as POST from "./Posts";

interface CommentsProps {
  parentId: string;
  parentPost: Post;
  setUser: (user: User) => any;
}

const Comments: React.FC<CommentsProps> = ({ parentId, parentPost, setUser }) => {
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

  function charCounterComment(inputField: HTMLElement | null) {
    if (!inputField) return;

    const maxLength = inputField.getAttribute("maxLength");
    const currentText = (document.getElementById("commentText" + parentId) as HTMLInputElement).value;

    if (!currentText || !maxLength) return;
    let currentLength = currentText.length;

    const charCount = document.getElementById("charCountComment" + parentId);
    if (!charCount) return;

    charCount.innerText = currentLength + "/" + parseInt(maxLength);
  }

  useEffect(() => {
    fetchComments();
  }, [parentId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newCommentText) return;

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

      {/* Mock add comment number to post so we don't have to reload */}
      const commentText = document.getElementById("commentNum" + parentPost.id);
      if (commentText && commentText.textContent) commentText.textContent = (parseInt(commentText.textContent) + 1).toString(10);

      setNewCommentText("");
      setNewCommentSong("");
    }
  };

  return (
    <div className="mt-4 ml-8 bg-backgorund-main border-l border-text-secondary pl-4">
      {POST.mapComments(parentPost, comments, user, renderTextWithHashtags, setUser, setComments, () => true)}

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
                id={"commentText" + parentId}
                value={newCommentText}
                onChange={(e) => {
                  setNewCommentText(e.target.value);
                  charCounterComment(document.getElementById("commentText" + parentId))
                }}
                placeholder="What's on your mind?"
                className="resize-none whitespace-pre-wrap bg-background-main w-full mt-1 text-text-main rounded-lg border border-background-tertiary p-2 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                rows={3}
                maxLength={280}
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

          <hr className="border-1 mt-4 border-background-tertiary"></hr>

          <div className="flex items-center justify-end gap-3 mt-3">
            <p id={"charCountComment" + parentId}
               className="text-text-secondary text-sm text-center">0/280</p>
            <button
              onClick={handleSubmitComment}
              className="bg-accent-blue-light text-text-main px-6 py-2 rounded-xl hover:bg-accent-blue"
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
