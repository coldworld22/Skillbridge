import { Linkedin, Mail } from "lucide-react";

const InstructorBio = ({
  name = "John Doe",
  title = "Senior Frontend Instructor",
  instructorBio = "With over 10 years of experience, John is passionate about making frontend learning fun and practical.",
  avatarUrl = "/images/default-avatar.png",
  linkedinUrl,
  email,
}) => {
  return (
    <div className="mb-12 p-6 bg-gray-800 rounded-lg shadow border border-gray-700">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={avatarUrl}
          alt={name}
          className="w-16 h-16 rounded-full object-cover border-2 border-yellow-400"
        />
        <div>
          <h3 className="text-xl font-bold text-white">{name}</h3>
          <p className="text-sm text-yellow-400">{title}</p>
        </div>
      </div>

      <p className="text-gray-300 leading-relaxed text-sm md:text-base">
        {instructorBio}
      </p>

      {(linkedinUrl || email) && (
        <div className="mt-4 flex gap-4 text-yellow-400">
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="hover:underline flex items-center gap-1">
              <Mail className="w-4 h-4" /> Contact
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default InstructorBio;
