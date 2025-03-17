import { useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { v4 as uuidv4 } from "uuid";

const CreateLiveClass = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [category, setCategory] = useState("Web Development");
  const [resources, setResources] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [generatedLink, setGeneratedLink] = useState("");

  const handleFileUpload = (event) => {
    const files = event.target.files;
    const uploadedResources = [...resources];

    for (let i = 0; i < files.length; i++) {
      uploadedResources.push({ name: files[i].name, url: URL.createObjectURL(files[i]) });
    }

    setResources(uploadedResources);
  };

  const handleThumbnailUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setThumbnail(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Generate unique class ID & streaming link
    const classId = uuidv4();
    const classLink = `/live-streams/${classId}`;
    setGeneratedLink(classLink);

    const newClass = {
      id: classId,
      title,
      description,
      date,
      time,
      price,
      maxParticipants,
      category,
      resources,
      classLink,
      thumbnail,
    };

    console.log("New Class Created:", newClass);
    alert(`Live class has been created successfully!\nLive Stream Link: ${classLink}`);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8 mt-16">
        <h1 className="text-3xl font-bold text-yellow-400">📅 Create a New Live Class</h1>

        <form onSubmit={handleSubmit} className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg">
          {/* Class Title */}
          <label className="block text-white font-semibold">Class Title:</label>
          <input
            type="text"
            placeholder="Enter class title"
            className="w-full p-3 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Description */}
          <label className="block mt-4 text-white font-semibold">Description:</label>
          <textarea
            placeholder="Describe your class"
            className="w-full p-3 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-white font-semibold">Date:</label>
              <input
                type="date"
                className="w-full p-3 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-white font-semibold">Time:</label>
              <input
                type="time"
                className="w-full p-3 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Price & Max Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-white font-semibold">Price (USD):</label>
              <input
                type="number"
                placeholder="Set class price"
                className="w-full p-3 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-white font-semibold">Max Participants:</label>
              <input
                type="number"
                placeholder="Set max students"
                className="w-full p-3 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Thumbnail Upload */}
          <label className="block mt-4 text-white font-semibold">Upload Thumbnail:</label>
          <input
            type="file"
            accept="image/*"
            className="w-full p-3 mt-2 bg-gray-700 text-white rounded-lg focus:outline-none"
            onChange={handleThumbnailUpload}
          />
          {thumbnail && <img src={thumbnail} alt="Thumbnail" className="mt-4 w-40 rounded-lg" />}

          {/* Submit Button */}
          <button
            type="submit"
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition w-full font-semibold"
          >
            Create Live Class
          </button>
        </form>

        {/* Display Generated Link */}
        {generatedLink && (
          <p className="text-green-400 mt-4 font-semibold">
            ✅ Live Class Created! Share this link:{" "}
            <span className="text-yellow-400">{generatedLink}</span>
          </p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CreateLiveClass;
