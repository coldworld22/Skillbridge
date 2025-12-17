import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import useAuthStore from "@/store/auth/authStore";
import {
  X,
  Mail,
  Smartphone,
  Image as ImageIcon,
  Tag,
  Users,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import groupService from "@/services/groupService";
import { fetchAllCategories } from "@/services/instructor/categoryService";
import userService from "@/services/profile/userService";
import { API_BASE_URL } from "@/config/config";
import styles from "./GroupForm.module.scss";

export default function GroupForm() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation("dashboard", { keyPrefix: "groupsCreatePage" });
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteMethods, setInviteMethods] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [maxSize, setMaxSize] = useState('');
  const [timezone, setTimezone] = useState('');
  const [approvalRequired, setApprovalRequired] = useState(true);

  const getAvatarUrl = (user) => {
    const url =
      user.avatar ||
      user.avatar_url ||
      user.profileImage ||
      user.profile_image ||
      '';
    if (!url) return '/images/default-avatar.png';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:'))
      return url;
    const clean = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE_URL}${clean}`;

  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const cats = await fetchAllCategories();
        setAvailableCategories(cats?.data || cats || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
      try {
        const tags = await groupService.getTags();
        setAvailableTags(tags || []);
      } catch (err) {
        console.error('Failed to load tags', err);
      }
      try {
        const result = await userService.searchUsers('');
        setUsers(result);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    const search = async () => {
      try {
        const result = await userService.searchUsers(query);
        setUsers(result);
      } catch {
        setUsers([]);
      }
    };
    search();
  }, [query]);

  useEffect(() => {
    if (type === 'private') {
      setApprovalRequired(true);
    }
  }, [type]);

  const filteredUsers = users.filter(
    (u) => !['admin', 'superadmin'].includes(u.role?.toLowerCase())
  );

  const toggleUserInvite = (user) => {
    if (invitedUsers.some((u) => u.id === user.id)) {
      setInvitedUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setInvitedUsers((prev) => [...prev, user]);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleTagSelect = (tag) => {
    const name = typeof tag === 'string' ? tag : tag.name;
    if (!tags.includes(name)) setTags([...tags, name]);
  };

  const toggleInviteMethod = (method) => {
    setInviteMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('name', groupName);
      payload.append('description', description);
      payload.append('visibility', type || 'public');
      payload.append('requires_approval', approvalRequired ? 'true' : 'false');
      if (imageFile) payload.append('cover_image', imageFile);
      if (category) payload.append('category_id', category);
      if (tags.length) payload.append('tags', JSON.stringify(tags));
      if (maxSize) payload.append('max_size', maxSize);
      if (timezone) payload.append('timezone', timezone);
      if (invitedUsers.length) {
        payload.append(
          'invited_users',
          JSON.stringify(invitedUsers.map((u) => u.id))
        );
      }
      if (inviteMethods.length) {
        payload.append('invite_methods', JSON.stringify(inviteMethods));
      }

      await groupService.createGroup(payload);

      if (invitedUsers.length) {
        toast.success(
          t("toasts.successWithInvites", { count: invitedUsers.length })
        );
        if (inviteMethods.length) {
          const methodLabels = inviteMethods
            .map((method) => t(`inviteMethods.${method}`))
            .join(", ");
          if (methodLabels) {
            toast(t("toasts.additionalMethods", { methods: methodLabels }));
          }
        }
      } else {
        toast.success(t("toasts.success"));
      }

      const normalizedRole = user?.role?.toLowerCase();
      const path =
        normalizedRole === 'instructor'
          ? '/dashboard/instructor/groups/my-groups'
          : normalizedRole === 'student'

          ? '/dashboard/student/groups/my-groups'
          : '/dashboard/admin/groups';
      await router.push(path);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t("toasts.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon}>
            <Users size={20} />
          </span>
          {t("heading")}
        </div>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <Tag size={18} />
          </div>
          <h3 className={styles.sectionTitle}>{t("sections.general")}</h3>
        </div>

        <div className={styles.grid}>
          <div>
            <label className={styles.label}>{`${t("labels.name")} *`}</label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              className={styles.input}
              placeholder={t("placeholders.name")}
            />
          </div>

          <div>
            <label className={styles.label}>{`${t("labels.type")} *`}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">{t("placeholders.type")}</option>
              <option value="private">{t("options.typePrivate")}</option>
              <option value="public">{t("options.typePublic")}</option>
            </select>
          </div>

          <div className={styles.full}>
            <div className={styles.checkboxCard}>
              <input
                type="checkbox"
                id="requiresApproval"
                checked={approvalRequired}
                onChange={(e) => setApprovalRequired(e.target.checked)}
                disabled={type === 'private'}
                className={styles.checkbox}
              />
              <label htmlFor="requiresApproval" className={styles.checkboxBody}>
                <span className={styles.checkboxTitle}>
                  <ShieldCheck size={16} />
                  {t("labels.requiresApproval", "Require approval to join")}
                </span>
                <span className={styles.checkboxHelp}>
                  {type === 'private'
                    ? t(
                        "help.privateAlwaysApproval",
                        "Private groups always require approval from an admin."
                      )
                    : t(
                        "help.requireApprovalHint",
                        "Keep this on so group admins approve every new member."
                      )}
                </span>
              </label>
            </div>
          </div>

          <div className={styles.full}>
            <label className={styles.label}>{t("labels.description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={styles.textarea}
              placeholder={t("placeholders.description")}
            />
          </div>

          <div>
            <label className={styles.label}>{t("labels.avatar")}</label>
            <div className={styles.avatarRow}>
              {imagePreview ? (
                <div style={{ position: "relative" }}>
                  <img src={imagePreview} alt="Preview" className={styles.avatarPreview} />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className={styles.removeImage}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <ImageIcon size={24} />
                </div>
              )}
              <label className={styles.uploadButton}>
                {imagePreview ? t("buttons.change") : t("buttons.upload")}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={styles.hiddenInput}
                />
              </label>
            </div>
          </div>

          <div>
            <label className={styles.label}>{t("labels.category")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.select}
            >
              <option value="">{t("placeholders.category")}</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={styles.label}>{t("labels.maxSize")}</label>
            <input
              type="number"
              min="1"
              value={maxSize}
              onChange={(e) => setMaxSize(e.target.value)}
              className={styles.input}
              placeholder={t("placeholders.maxSize")}
            />
          </div>

          <div>
            <label className={styles.label}>{t("labels.timezone")}</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder={t("placeholders.timezone")}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.tagsSection}>
          <label className={styles.label}>{t("labels.tags")}</label>
          <div className={styles.tagInputRow}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTagAdd()}
              placeholder={t("placeholders.tagInput")}
              className={styles.input}
            />
            <button type="button" onClick={handleTagAdd} className={styles.tagButton}>
              {t("buttons.addTag")}
            </button>
          </div>

          {availableTags.length > 0 && (
            <div>
              <p className={styles.helper}>{t("labels.popularTags")}</p>
              <div className={styles.tagInputRow}>
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagSelect(tag)}
                    className={styles.filterPill}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div className={styles.tagInputRow}>
              {tags.map((tag, idx) => (
                <div key={idx} className={styles.tagChip}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className={styles.chipClose}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {type === 'private' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <Mail size={18} />
            </div>
            <h3 className={styles.sectionTitle}>{t("sections.invites")}</h3>
          </div>

          <div>
            <label className={styles.label}>{t("labels.searchMembers")}</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("placeholders.searchMembers")}
              className={styles.input}
            />
          </div>

          <div className={styles.userGrid}>
            {filteredUsers.map((user) => {
              const selected = invitedUsers.some((u) => u.id === user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => toggleUserInvite(user)}
                  className={`${styles.userCard} ${selected ? styles.userSelected : ""}`}
                >
                  <img src={getAvatarUrl(user)} alt={user.name} className={styles.avatarSm} />
                  <div className={styles.userBody}>
                    <p className={styles.userName}>{user.name}</p>
                    <p className={styles.userEmail}>{user.email}</p>
                  </div>
                  <div
                    className={`${styles.checkIndicator} ${
                      selected ? styles.checkIndicatorSelected : ""
                    }`}
                  >
                    {selected && (
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {invitedUsers.length > 0 && (
            <>
              <div>
                <label className={styles.label}>
                  {t("labels.selectedMembers", { count: invitedUsers.length })}
                </label>
                <div className={styles.selectedList}>
                  {invitedUsers.map((u) => (
                    <div key={u.id} className={styles.selectedPill}>
                      <img src={getAvatarUrl(u)} alt={u.name} className={styles.pillAvatar} />
                      <span>{u.name.split(" ")[0]}</span>
                      <button type="button" onClick={() => toggleUserInvite(u)} className={styles.chipClose}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={styles.label}>{t("labels.invitationMethods")}</label>
                <div className={styles.inviteMethods}>
                  {[
                    {
                      value: "email",
                      icon: <Mail size={16} />,
                      label: t("inviteMethods.email"),
                    },
                    {
                      value: "whatsapp",
                      icon: <Smartphone size={16} />,
                      label: t("inviteMethods.whatsapp"),
                    },
                  ].map((method) => {
                    const active = inviteMethods.includes(method.value);
                    return (
                      <label
                        key={method.value}
                        className={`${styles.inviteMethod} ${active ? styles.inviteMethodActive : ""}`}
                      >
                        <div className={`${styles.inviteIcon} ${active ? styles.inviteIconActive : ""}`}>
                          {method.icon}
                        </div>
                        <span>{method.label}</span>
                        <input
                          type="checkbox"
                          value={method.value}
                          checked={active}
                          onChange={() => toggleInviteMethod(method.value)}
                          className={styles.srOnly}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
                <path
                  fill="currentColor"
                  opacity="0.75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {t("buttons.submitting")}
            </span>
          ) : (
            t("buttons.submit")
          )}
        </button>
      </div>
    </form>
  );
}
