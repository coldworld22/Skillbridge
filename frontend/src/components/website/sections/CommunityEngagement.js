// ✅ Enhanced Community Landing Page with Full Features
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaCommentDots,
  FaUsers,
  FaPlus,
  FaSearch,
} from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/router";
import { fetchDiscussions, fetchTopContributors } from "@/services/communityService";
import { getBadge } from "@/utils/community/reputation";
import { useTranslation, Trans } from "next-i18next";

const CommunityLandingPage = () => {
  const [discussions, setDiscussions] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tags, setTags] = useState([]);
  const router = useRouter();
  const { t } = useTranslation("website");

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchDiscussions();
        setDiscussions(
          list.slice(0, 5).map((d) => ({
            id: d.id,
            title: d.title,
            user: d.user_name || t("anonymous"),
            replies: d.replies || 0,
            image_url: d.image_url,
          }))
        );

        const tagSet = new Set();
        list.forEach((d) => {
          if (Array.isArray(d.tags)) {
            d.tags.forEach((t) => tagSet.add(t));
          }
        });
        if (tagSet.size) {
          setTags(Array.from(tagSet).slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load discussions", err);
      }
      try {
        const contribs = await fetchTopContributors();
        setContributors(contribs);
      } catch (err) {
        console.error("Failed to load contributors", err);
      }

    };
    load();
  }, [t]);


  return (
    <div id="community" className="bg-gray-900 min-h-screen text-white">
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="py-16 text-center px-4"
      >
        <h1 className="text-4xl font-bold text-yellow-500 mb-4">{t("community_heading")}</h1>
        <p className="text-lg text-gray-400 mb-6">{t("community_text")}</p>

        {/* Ask Question CTA */}
        <Link href="/community/ask">
          <button className="mb-10 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600 flex items-center gap-2 mx-auto">
            <FaPlus /> {t("ask_question")}
          </button>
        </Link>

        {/* Search Bar */}
        <div className="max-w-lg mx-auto mb-10 relative">
          <input
            type="text"
            placeholder={t("search_discussions_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 focus:outline-none text-white"
          />
          <FaSearch className="absolute right-3 top-3 text-gray-400" />
        </div>

        {/* Popular Tags */}
        <div className="mb-10">
          <h4 className="text-xl font-semibold mb-2">{t("popular_tags")}</h4>
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map((tag) => (
              <span key={tag} className="bg-yellow-600 px-3 py-1 rounded-full text-sm text-white cursor-pointer hover:bg-yellow-500 transition">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {/* Trending Discussions */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FaCommentDots className="text-yellow-500" /> {t("trending_discussions")}
            </h3>
            <ul className="space-y-4">
              {discussions
                .filter((d) =>
                  d.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((discussion) => (
                  <motion.li
                    key={discussion.id}
                    className="p-4 bg-gray-700 rounded-lg flex justify-between items-center hover:bg-gray-600 cursor-pointer transition"
                    whileHover={{ scale: 1.03 }}
                    onClick={() => {
                      if (!discussion.id) return;
                      router.push(`/community/question/${discussion.id}`);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {discussion.image_url && (
                        <img
                          src={discussion.image_url}
                          alt={discussion.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <h4 className="text-lg font-semibold">{discussion.title}</h4>
                        <p className="text-gray-400">
                          {t("by_author", { author: discussion.user })}
                        </p>
                      </div>
                    </div>
                    <span className="bg-yellow-500 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
                      {t("replies_count", { count: discussion.replies })}
                    </span>
                  </motion.li>
                ))}
            </ul>
          </div>

          {/* Top Contributors */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FaUsers className="text-yellow-500" /> {t("top_contributors")}
            </h3>
            <ul className="space-y-4">
              {contributors.map((contributor, index) => (
                <motion.li
                  key={index}
                  className="p-4 bg-gray-700 rounded-lg flex justify-between items-center hover:bg-gray-600 transition"
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="flex items-center gap-3">
                    <img src={contributor.avatar || "/images/default-avatar.png"} className="w-10 h-10 rounded-full border border-gray-500" />
                    <div>
                      <h4 className="text-lg font-semibold">{contributor.name} {getBadge(contributor.contributions)}</h4>
                      <p className="text-gray-400 text-sm">{contributor.contributions} {t("contributions")} • {contributor.reputation} {t("reputation")}</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA to Explore More */}
        <motion.div className="mt-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Link href="/community">
            <button className="px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 transition shadow-lg">
              {t("community_explore")}
            </button>
          </Link>
        </motion.div>

        {/* Join Prompt */}
        <motion.div className="mt-6 text-sm text-gray-400">
          <Trans
            i18nKey="community_join_prompt"
            t={t}
            components={{ link: <Link href="/auth/register" className="text-yellow-400 hover:underline" /> }}
          />
        </motion.div>
      </motion.section>
    </div>
  );
};

export default CommunityLandingPage;

