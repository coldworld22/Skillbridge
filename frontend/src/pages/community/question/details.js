import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaArrowUp, FaArrowDown, FaEye, FaComment, FaUser, FaHeart, FaVideo, FaPaperclip, FaMicrophone, FaTrash, FaEdit } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { useRouter } from "next/router";
import RichTextEditor from "@/components/RichTextEditor";
import ReactMarkdown from "react-markdown";
import {
  fetchDiscussionById,
  fetchReplies,
  createReply,
  likeDiscussion,
  unlikeDiscussion,
  voteDiscussion,
} from "@/services/communityService";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";

const QuestionDetails = () => {
  const router = useRouter();
  const [question, setQuestion] = useState(null);
  const [likes, setLikes] = useState(0);
  const [votes, setVotes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    if (!router.query.id) return;
    const load = async () => {
      const data = await fetchDiscussionById(router.query.id);
      if (data) {
        setQuestion(data);
        setLikes(data.likes || 0);
        setVotes(data.votes || 0);
        setLiked(Boolean(data.liked));
        try {
          const r = await fetchReplies(router.query.id);
          setReplies(r);
        } catch (err) {
          console.error(err);
        }
      }
    };
    load();
  }, [router.query.id]);

  // ✅ Handle Like Button
  const handleLike = async () => {
    try {
      if (!liked) {
        const res = await likeDiscussion(router.query.id);
        setLikes(res.likes);
        setLiked(true);
        toast.success('Liked');
      } else {
        const res = await unlikeDiscussion(router.query.id);
        setLikes(res.likes);
        setLiked(false);
        toast.info('Like removed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update like');
    }
  };

  // ✅ Handle Vote System
  const handleVote = async (type) => {
    try {
      const res = await voteDiscussion(router.query.id, type);
      setVotes(res.votes);
      toast.success(type === 'up' ? 'Upvoted' : 'Downvoted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to vote');
    }
  };

  // ✅ Handle Audio Upload
  const handleAudioUpload = (e) => {
    const f = e.target.files[0];
    setAudioFile(f);
    if (f) {
      setAudioPreview(URL.createObjectURL(f));
    } else {
      setAudioPreview(null);
    }
  };

  // ✅ Handle File Upload
  const handleFileUpload = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) {
      setFilePreview(URL.createObjectURL(f));
    } else {
      setFilePreview(null);
    }
  };

  // ✅ Handle Video Call Invitation
  const handleVideoInvite = () => {
    const chatId = Math.random().toString(36).substr(2, 9);
    router.push(`/video-call/${chatId}`);
  };

  // ✅ Handle Reply Submission
  const handleReply = async () => {
    if (!replyText) return;
    const fd = new FormData();
    fd.append('content', replyText);
    if (file) fd.append('file', file);
    if (audioFile) fd.append('audio', audioFile);
    try {
      const newReply = await createReply(router.query.id, fd);
      setReplies([...replies, newReply]);
      setReplyText('');
      setFile(null);
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(null);
      setAudioFile(null);
      if (audioPreview) URL.revokeObjectURL(audioPreview);
      setAudioPreview(null);
      toast.success('Reply posted');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to post reply');
    }
  };

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
      if (audioPreview) URL.revokeObjectURL(audioPreview);
    };
  }, [filePreview, audioPreview]);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8 mt-16">
        <h1 className="text-3xl font-bold text-yellow-500">{question?.title}</h1>
        <div className="flex items-center text-gray-400 text-sm mt-2">
          {question?.user_avatar ? (
            <img src={question.user_avatar} alt="avatar" className="w-6 h-6 rounded-full mr-2" />
          ) : (
            <FaUser className="mr-2 text-yellow-500" />
          )}
          <span className="font-bold text-white">{question?.user_name}</span>
          <span className="ml-4">{new Date(question?.created_at || '').toLocaleDateString()}</span>
        </div>

        {/* ✅ Voting, Likes, Views */}
        <div className="flex items-center gap-6 mt-4 text-gray-400">
          <button className="flex items-center gap-1 text-gray-400 hover:text-red-500" onClick={handleLike}>
            <FaHeart /> {likes} Likes
          </button>
          <button className="flex items-center gap-1" onClick={() => handleVote("up")}>
            <FaArrowUp /> {votes} Votes
          </button>
          <button className="flex items-center gap-1" onClick={() => handleVote("down")}>
            <FaArrowDown /> Downvote
          </button>
          <span className="flex items-center gap-1">
            <FaEye /> {question?.views} views
        </span>
      </div>

      {/* ✅ Question Content */}
        {question?.image_url && (
          <img src={question.image_url} alt="attachment" className="mt-4 max-w-full rounded" />
        )}
        <p className="text-gray-300 mt-4">{question?.content}</p>

        {/* ✅ Tags */}
        <div className="flex space-x-2 mt-3">
          {question?.tags?.map((tag, index) => (
            <span key={index} className="bg-yellow-600 px-2 py-1 rounded text-sm text-white">
              {tag}
            </span>
          ))}
        </div>

        {/* ✅ Replies Section */}
        <h2 className="text-2xl font-bold text-yellow-500 mt-8">Replies</h2>
        <div className="mt-4 space-y-6">
          {replies.map((reply) => (
            <div key={reply.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
              <div className="flex items-center text-sm text-gray-400 mb-2">
                {reply.user_avatar ? (
                  <img src={reply.user_avatar} alt="avatar" className="w-5 h-5 rounded-full mr-2" />
                ) : (
                  <FaUser className="mr-2" />
                )}
                <span className="font-bold text-white">{reply.user_name}</span>
                <span className="ml-2">{new Date(reply.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-300 mt-2"><ReactMarkdown>{reply.content}</ReactMarkdown></p>
              {reply.file_url && (
                /(mp3|wav|ogg|m4a)$/i.test(reply.file_url)
                  ? (
                      <audio controls className="mt-2 w-full">
                        <source src={reply.file_url} />
                        Your browser does not support the audio element.
                      </audio>
                    )
                  : (
                      <img
                        src={reply.file_url}
                        alt="attachment"
                        className="mt-2 max-w-full rounded"
                      />
                    )
              )}
            </div>
          ))}
          {replies.length === 0 && <p className="text-gray-400">No replies yet.</p>}
        </div>

        {/* ✅ User Reply Section */}
        <h2 className="text-2xl font-bold text-yellow-500 mt-8">Your Reply</h2>
        <RichTextEditor value={replyText} onChange={setReplyText} />
        <button onClick={handleReply} className="mt-4 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600">
          Post Reply
        </button>

        {/* ✅ File & Video Call */}
        <input type="file" accept="audio/*" className="mt-3 bg-gray-800 p-2 rounded-lg text-white" onChange={handleAudioUpload} />
        <input type="file" accept=".pdf,.jpg,.png" className="mt-3 bg-gray-800 p-2 rounded-lg text-white" onChange={handleFileUpload} />
        {audioFile && audioPreview && (
          <div className="mt-2">
            <audio controls className="w-full">
              <source src={audioPreview} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        {file && (
          <div className="mt-2">
            {file.type.startsWith('image/') ? (
              <img src={filePreview} alt="preview" className="max-w-full rounded" />
            ) : (
              <p className="text-sm text-gray-400">{file.name}</p>
            )}
          </div>
        )}
        <button onClick={handleVideoInvite} className="mt-3 px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 flex items-center gap-2">
          <FaVideo /> Start Video Call
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default QuestionDetails;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"], nextI18NextConfig)),
    },
  };
}
