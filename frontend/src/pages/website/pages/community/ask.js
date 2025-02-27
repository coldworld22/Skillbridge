import { useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

const AskQuestionPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-yellow-500">Ask a Public Question</h1>

        <div className="bg-gray-800 p-6 rounded-md mt-6">
          <label className="block font-bold">Title</label>
          <input className="w-full p-3 mt-2 bg-gray-700 rounded-md text-white" placeholder="Enter question title" value={title} onChange={(e) => setTitle(e.target.value)} />

          <label className="block font-bold mt-4">Description</label>
          <textarea className="w-full p-3 mt-2 bg-gray-700 rounded-md text-white" placeholder="Describe your question in detail" value={description} onChange={(e) => setDescription(e.target.value)} />

          <label className="block font-bold mt-4">Tags</label>
          <input className="w-full p-3 mt-2 bg-gray-700 rounded-md text-white" placeholder="Comma-separated tags" value={tags} onChange={(e) => setTags(e.target.value)} />

          <button className="mt-6 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600 transition">Submit Question</button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AskQuestionPage;
