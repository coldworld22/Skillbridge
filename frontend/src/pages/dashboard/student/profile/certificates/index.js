import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

const dummyCertificates = [
  { id: 1, title: "React.js Mastery", date: "Jan 10, 2024", url: "/certificates/react.pdf" },
  { id: 2, title: "Advanced JavaScript", date: "Feb 5, 2024", url: "/certificates/js.pdf" },
];

const Certificates = () => {
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-400">📜 My Certificates</h1>

        <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg">
          {dummyCertificates.map((cert) => (
            <div key={cert.id} className="flex justify-between items-center bg-gray-700 p-4 rounded-lg mb-3">
              <div>
                <h2 className="text-xl font-bold text-yellow-400">{cert.title}</h2>
                <p className="text-gray-400">Issued on: {cert.date}</p>
              </div>
              <a
                href={cert.url}
                download
                className="bg-blue-500 px-4 py-2 rounded-lg text-white hover:bg-blue-600"
              >
                📥 Download
              </a>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Certificates;
