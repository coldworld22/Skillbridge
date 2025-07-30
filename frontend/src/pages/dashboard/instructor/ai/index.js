import Link from "next/link";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import { FaRobot, FaLightbulb, FaFileAlt, FaComments, FaChartBar, FaBrain } from 'react-icons/fa';

const tools = [
  { title: 'Course Outline Generator', description: 'Use AI to draft an initial outline for your next course.', icon: FaBrain, link: '/dashboard/instructor/ai/outline' },
  { title: 'Quiz Generator', description: 'Create practice quizzes for your students in seconds.', icon: FaLightbulb, link: '/dashboard/instructor/ai/quizzes' },
  { title: 'Assignment Feedback', description: 'Let AI help review student submissions and suggest improvements.', icon: FaFileAlt, link: '/dashboard/instructor/ai/feedback' },
  { title: 'Chat Tutor', description: 'Answer student questions with the help of an AI assistant.', icon: FaComments, link: '/dashboard/instructor/ai/chat' },
  { title: 'Performance Insights', description: 'Analyze class performance trends using AI analytics.', icon: FaChartBar, link: '/dashboard/instructor/ai/insights' },
  { title: 'AI Settings', description: 'Manage your preferred AI providers and settings.', icon: FaRobot, link: '/dashboard/instructor/ai/settings' },
];

export default function InstructorAIToolsPage() {
  return (
    <InstructorLayout title="AI Tools">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">AI Tools</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <Link key={idx} href={tool.link} className="border border-gray-200 rounded-lg p-5 bg-white shadow hover:shadow-md transition block">
                <div className="flex flex-col items-center text-center gap-3">
                  <Icon className="text-yellow-500" size={32} />
                  <h2 className="font-semibold text-lg text-gray-800">{tool.title}</h2>
                  <p className="text-sm text-gray-500">{tool.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </InstructorLayout>
  );
}

