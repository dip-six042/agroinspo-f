import { SponsoredSlot } from '../business/Sponsored';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Flag, VolumeX, Ban, Trash2, UserPlus, UserCheck, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, Comment, firstName, Post, REPORT_REASON_LABELS, TOPIC_LABELS, timeAgo } from '../../lib/api';
import { Avatar, Button, Kicker, Notice, textareaClass, WRAP } from '../ui';

/* ---------------- shared bits ---------------- */

export const EmailVerifyBanner: React.FC = () => {
  const { user, devLink, resendVerification } = useAuth();
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  if (!user || user.emailVerified) return null;
  return (
    <Notice>
      <span className="font-medium text-ink">Confirm your email to post and comment.</span> We sent a link to {user.email}.{' '}
      <button
        className="underline underline-offset-4"
        onClick={async () => {
          setErr('');
          try {
            await resendVerification();
            setSent(true);
          } catch (e) {
            setErr(e instanceof ApiError ? e.message : 'Couldn’t send. Try again later.');
          }
        }}
      >
        {sent ? 'Sent again' : 'Resend link'}
      </button>
      {err && <span className="block mt-1 text-rose-700">{err}</span>}
      {devLink && (
        <span className="block mt-2 text-slate-500">
          Development mode, no email provider yet:{' '}
          <a href={devLink} className="underline break-all">
            open the verification link
          </a>
        </span>
      )}
    </Notice>
  );
};

const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-[13px] px-5 py-3 rounded-full shadow-xl flex items-center gap-3">
      {message}
      <button onClick={onClose} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const ReportDialog: React.FC<{
  target: { type: 'post' | 'comment' | 'user'; id: string; label: string };
  onClose: () => void;
  onDone: (msg: string) => void;
}> = ({ target, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return setError('Choose a reason.');
    setBusy(true);
    try {
      const r = await api.post<{ duplicate?: boolean }>('/reports', { targetType: target.type, targetId: target.id, reason, details });
      onDone(r.duplicate ? 'You’ve already reported this. We’re reviewing it.' : 'Thanks. Our moderators will review this.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t send the report.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="report-title" className="font-display text-[22px] font-normal">
            Report {target.label}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-stone-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-1 text-[13px] text-slate-500">Reports are private. The person you report isn’t told who sent it.</p>
        <fieldset className="mt-5 space-y-1.5">
          <legend className="sr-only">Reason</legend>
          {Object.entries(REPORT_REASON_LABELS).map(([k, label]) => (
            <label key={k} className={`flex items-center gap-3 px-4 h-11 rounded-full border cursor-pointer text-[13px] ${reason === k ? 'border-ink' : 'border-stone-200'}`}>
              <input type="radio" name="reason" value={k} checked={reason === k} onChange={() => setReason(k)} className="accent-[#141414]" />
              {label}
            </label>
          ))}
        </fieldset>
        <label htmlFor="report-details" className="block mt-4 text-[13px] font-medium">
          Details <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea id="report-details" rows={3} maxLength={1000} className={`${textareaClass} mt-1.5`} value={details} onChange={(e) => setDetails(e.target.value)} />
        {error && <Notice tone="error" className="mt-3">{error}</Notice>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={busy}>
            Send report
          </Button>
        </div>
      </form>
    </div>
  );
};

/* ---------------- comments ---------------- */

const CommentThread: React.FC<{
  post: Post;
  onCount: (n: number) => void;
  onReport: (c: Comment) => void;
  toast: (m: string) => void;
}> = ({ post, onCount, onReport, toast }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api
      .get<{ comments: Comment[] }>(`/posts/${post.id}/comments`)
      .then((r) => setComments(r.comments))
      .catch((e: ApiError) => setError(e.message));
  }, [post.id]);

  const top = (comments ?? []).filter((c) => !c.parentId);
  const replies = (id: string) => (comments ?? []).filter((c) => c.parentId === id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.post<{ comment: Comment }>(`/posts/${post.id}/comments`, { body, parentId: replyTo?.id });
      const next = [...(comments ?? []), r.comment];
      setComments(next);
      onCount(next.length);
      setBody('');
      setReplyTo(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t post your comment.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Comment) => {
    try {
      await api.del(`/comments/${c.id}`);
      const next = (comments ?? []).filter((x) => x.id !== c.id && x.parentId !== c.id);
      setComments(next);
      onCount(next.length);
      toast('Comment deleted.');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Couldn’t delete.');
    }
  };

  const CommentRow: React.FC<{ c: Comment; nested?: boolean }> = ({ c, nested }) => (
    <div className={`flex gap-3 ${nested ? 'mt-3' : ''}`}>
      <Avatar name={c.author.name} src={c.author.avatarUrl} size={nested ? 28 : 32} />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-mist px-4 py-2.5">
          <p className="text-[12px]">
            <span className="font-medium">{c.author.name}</span>
            <span className="text-slate-400"> · {timeAgo(c.createdAt)}</span>
          </p>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{c.body}</p>
        </div>
        <div className="flex gap-4 mt-1 ml-2 text-[12px] text-slate-500">
          {user && (
            <button
              onClick={() => {
                setReplyTo(nested ? top.find((t) => t.id === c.parentId) ?? c : c);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className="hover:text-ink"
            >
              Reply
            </button>
          )}
          {user && user.id !== c.author.id && (
            <button onClick={() => onReport(c)} className="hover:text-ink">
              Report
            </button>
          )}
          {user && (user.id === c.author.id || user.role === 'admin') && (
            <button onClick={() => remove(c)} className="hover:text-rose-700">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-4 pt-4 border-t border-stone-100">
      {comments === null && !error && <p className="text-[13px] text-slate-500">Loading comments…</p>}
      {comments && comments.length === 0 && <p className="text-[13px] text-slate-500">No comments yet. Start the conversation.</p>}
      <div className="space-y-4">
        {top.map((c) => (
          <div key={c.id}>
            <CommentRow c={c} />
            {replies(c.id).length > 0 && (
              <div className="ml-11 border-l border-stone-200 pl-3">
                {replies(c.id).map((r) => (
                  <CommentRow key={r.id} c={r} nested />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {user ? (
        <form onSubmit={submit} className="mt-4">
          {replyTo && (
            <p className="mb-2 text-[12px] text-slate-500 flex items-center gap-2">
              Replying to {replyTo.author.name}
              <button type="button" onClick={() => setReplyTo(null)} className="underline">
                Cancel
              </button>
            </p>
          )}
          <div className="flex gap-2 items-end">
            <label htmlFor={`c-${post.id}`} className="sr-only">
              Write a comment
            </label>
            <textarea
              id={`c-${post.id}`}
              ref={inputRef}
              rows={1}
              maxLength={2000}
              placeholder="Write a comment"
              className={`${textareaClass} min-h-11 py-2.5`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <Button type="submit" busy={busy} disabled={!body.trim()} className="shrink-0">
              Post
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-[13px] text-slate-500">Log in to join the conversation.</p>
      )}
      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
    </div>
  );
};

/* ---------------- post card ---------------- */

const PostCard: React.FC<{
  post: Post;
  following: Set<string>;
  onChange: (p: Post) => void;
  onHideAuthor: (authorId: string) => void;
  onRemove: (id: string) => void;
  onToggleFollow: (authorId: string) => void;
  onReport: (t: { type: 'post' | 'comment' | 'user'; id: string; label: string }) => void;
  toast: (m: string) => void;
  onRequireLogin: () => void;
}> = ({ post, following, onChange, onHideAuthor, onRemove, onToggleFollow, onReport, toast, onRequireLogin }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const mine = user?.id === post.author.id;

  const like = async () => {
    if (!user) return onRequireLogin();
    onChange({ ...post, liked: !post.liked, likeCount: post.likeCount + (post.liked ? -1 : 1) });
    try {
      const r = await api.post<{ liked: boolean; likeCount: number }>(`/posts/${post.id}/like`);
      onChange({ ...post, liked: r.liked, likeCount: r.likeCount });
    } catch (e) {
      onChange(post);
      toast(e instanceof ApiError ? e.message : 'Couldn’t like this post.');
    }
  };
  const save = async () => {
    if (!user) return onRequireLogin();
    const r = await api.post<{ saved: boolean }>(`/posts/${post.id}/save`).catch(() => null);
    if (r) {
      onChange({ ...post, saved: r.saved });
      toast(r.saved ? 'Saved. Find it under Saved.' : 'Removed from Saved.');
    }
  };
  const blockOrMute = async (kind: 'block' | 'mute') => {
    setMenu(false);
    setConfirmBlock(false);
    try {
      await api.post('/blocks', { userId: post.author.id, kind });
      onHideAuthor(post.author.id);
      toast(kind === 'block' ? `${post.author.name} is blocked. Undo in Settings → Safety.` : `${post.author.name} is muted. Undo in Settings → Safety.`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Couldn’t do that.');
    }
  };
  const del = async () => {
    setMenu(false);
    try {
      await api.del(`/posts/${post.id}`);
      onRemove(post.id);
      toast('Post deleted.');
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Couldn’t delete.');
    }
  };

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
      <header className="flex items-start gap-3">
        <Avatar name={post.author.name} src={post.author.avatarUrl} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium truncate">{post.author.name}</p>
          <p className="text-[12px] text-slate-500 truncate">
            {post.author.title || post.author.role} · {timeAgo(post.createdAt)}
          </p>
        </div>
        {post.isSponsored && <span className="px-2.5 py-1 rounded-full bg-mist text-[11px] font-medium">Sponsored</span>}
        {user && (
          <div className="relative">
            <button onClick={() => setMenu(!menu)} aria-label="More actions" aria-expanded={menu} className="p-2 -m-1 rounded-full hover:bg-stone-100 text-slate-500">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menu && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-2xl border border-stone-200 shadow-xl p-1.5 z-20 text-[13px]" onMouseLeave={() => setMenu(false)}>
                {!mine && (
                  <>
                    <button onClick={() => (setMenu(false), onToggleFollow(post.author.id))} className="w-full flex items-center gap-2.5 px-3 h-10 rounded-xl hover:bg-stone-50 text-left">
                      {following.has(post.author.id) ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {following.has(post.author.id) ? 'Unfollow' : 'Follow'} {firstName(post.author.name)}
                    </button>
                    <button onClick={() => blockOrMute('mute')} className="w-full flex items-center gap-2.5 px-3 h-10 rounded-xl hover:bg-stone-50 text-left">
                      <VolumeX className="w-4 h-4" /> Mute
                    </button>
                    <button onClick={() => setConfirmBlock(true)} className="w-full flex items-center gap-2.5 px-3 h-10 rounded-xl hover:bg-stone-50 text-left">
                      <Ban className="w-4 h-4" /> Block
                    </button>
                    <button
                      onClick={() => (setMenu(false), onReport({ type: 'post', id: post.id, label: 'this post' }))}
                      className="w-full flex items-center gap-2.5 px-3 h-10 rounded-xl hover:bg-stone-50 text-left"
                    >
                      <Flag className="w-4 h-4" /> Report post
                    </button>
                  </>
                )}
                {(mine || user.role === 'admin') && (
                  <button onClick={del} className="w-full flex items-center gap-2.5 px-3 h-10 rounded-xl hover:bg-rose-50 text-rose-700 text-left">
                    <Trash2 className="w-4 h-4" /> Delete post
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {confirmBlock && (
        <Notice className="mt-4">
          Block {post.author.name}? You won’t see each other’s posts or comments, and they can’t reply to you.
          <span className="flex gap-2 mt-3">
            <Button variant="danger" className="h-9" onClick={() => blockOrMute('block')}>
              Block
            </Button>
            <Button variant="outline" className="h-9" onClick={() => setConfirmBlock(false)}>
              Cancel
            </Button>
          </span>
        </Notice>
      )}

      <p className="mt-4 text-[14px] leading-relaxed whitespace-pre-wrap break-words">{post.body}</p>
      <span className="inline-block mt-3 text-[12px] text-slate-500">
        {post.kind === 'article' && <span className="mr-2 inline-flex px-2 py-0.5 rounded-full bg-lime text-ink text-[11px] font-medium">Article · screened creator</span>}
        #{TOPIC_LABELS[post.topic] ?? post.topic}
      </span>

      <footer className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1 text-[13px] text-slate-600">
        <button onClick={like} aria-pressed={post.liked} className={`flex items-center gap-1.5 h-9 px-3 rounded-full hover:bg-stone-100 ${post.liked ? 'text-ink' : ''}`}>
          <Heart className={`w-4 h-4 ${post.liked ? 'fill-lime stroke-ink' : ''}`} />
          <span className="font-mono-numbers">{post.likeCount}</span>
          <span className="sr-only">likes</span>
        </button>
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-1.5 h-9 px-3 rounded-full hover:bg-stone-100">
          <MessageCircle className="w-4 h-4" />
          <span className="font-mono-numbers">{post.commentCount}</span>
          <span className="sr-only">comments</span>
        </button>
        <button onClick={save} aria-pressed={post.saved} className="ml-auto flex items-center gap-1.5 h-9 px-3 rounded-full hover:bg-stone-100">
          <Bookmark className={`w-4 h-4 ${post.saved ? 'fill-ink' : ''}`} />
          {post.saved ? 'Saved' : 'Save'}
        </button>
      </footer>

      {open && (
        <CommentThread
          post={post}
          onCount={(n) => onChange({ ...post, commentCount: n })}
          onReport={(c) => onReport({ type: 'comment', id: c.id, label: 'this comment' })}
          toast={toast}
        />
      )}
    </article>
  );
};

/* ---------------- page ---------------- */

type FeedView = 'following' | 'all' | 'saved';

export const CommunityView: React.FC<{ onNavigate: (v: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [view, setView] = useState<FeedView>(user ? 'following' : 'all');
  const [topic, setTopic] = useState('');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment' | 'user'; id: string; label: string } | null>(null);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  // Composer
  const [draft, setDraft] = useState('');
  const [draftTopic, setDraftTopic] = useState('');
  const [posting, setPosting] = useState(false);
  const [composeError, setComposeError] = useState('');
  const [asArticle, setAsArticle] = useState(false);
  const [creatorTopics, setCreatorTopics] = useState<string[]>([]);
  useEffect(() => {
    if (user) api.get<{ topics: { topic: string }[] }>('/me/creator').then((r) => setCreatorTopics(r.topics.map((t) => t.topic))).catch(() => {});
  }, [user?.id]);
  const canArticle = creatorTopics.includes(draftTopic);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!user) {
      setView((v) => (v === 'all' ? v : 'all'));
      return;
    }
    api
      .get<{ topics: string[]; users: { id: string }[] }>('/me/follows')
      .then((r) => {
        setFollowedTopics(r.topics);
        setFollowedUsers(new Set(r.users.map((u) => u.id)));
        setDraftTopic((d) => d || r.topics[0] || '');
      })
      .catch(() => {});
  }, [user?.id]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (user && view !== 'all') p.set('view', view);
    if (topic) p.set('topic', topic);
    if (debounced) p.set('q', debounced);
    return p;
  }, [view, topic, debounced, user?.id]);

  const load = useCallback(
    async (before?: string) => {
      setLoading(true);
      setError('');
      try {
        const p = new URLSearchParams(params);
        if (before) p.set('before', before);
        const r = await api.get<{ posts: Post[]; nextBefore: string | null }>(`/posts?${p}`);
        setPosts((prev) => (before ? [...prev, ...r.posts] : r.posts));
        setNextBefore(r.nextBefore);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Couldn’t load the feed.');
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  useEffect(() => {
    load();
  }, [load]);

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposeError('');
    if (!draftTopic) return setComposeError('Choose a topic for your post.');
    setPosting(true);
    try {
      const kind = asArticle && canArticle ? 'article' : 'discussion';
      const r = await api.post<{ post: Post }>('/posts', { topic: draftTopic, body: draft, kind });
      setPosts((p) => [r.post, ...p]);
      setDraft('');
      setAsArticle(false);
      setToastMsg(kind === 'article' ? 'Article published.' : 'Posted.');
    } catch (err) {
      setComposeError(err instanceof ApiError ? err.message : 'Couldn’t publish.');
    } finally {
      setPosting(false);
    }
  };

  const toggleTopicFollow = async (t: string) => {
    const r = await api.post<{ following: boolean }>('/follows', { type: 'topic', target: t }).catch(() => null);
    if (!r) return;
    setFollowedTopics((list) => (r.following ? [...list, t] : list.filter((x) => x !== t)));
    setToastMsg(r.following ? `Following ${TOPIC_LABELS[t]}.` : `Unfollowed ${TOPIC_LABELS[t]}.`);
  };
  const toggleUserFollow = async (id: string) => {
    const r = await api.post<{ following: boolean }>('/follows', { type: 'user', target: id }).catch(() => null);
    if (!r) return;
    setFollowedUsers((s) => {
      const n = new Set(s);
      r.following ? n.add(id) : n.delete(id);
      return n;
    });
    setToastMsg(r.following ? 'Following. Their posts will show in For you.' : 'Unfollowed.');
  };

  const tabs: { id: FeedView; label: string }[] = [
    { id: 'following', label: 'For you' },
    { id: 'all', label: 'Everything' },
    { id: 'saved', label: 'Saved' }
  ];

  return (
    <div className={`${WRAP} py-12 sm:py-16`}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <Kicker>Community</Kicker>
          <h1 className="mt-4 font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em]">
            Ask, share and learn from people who farm.
          </h1>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <label htmlFor="feed-search" className="sr-only">
            Search posts
          </label>
          <input
            id="feed-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts and people"
            className="w-full h-11 pl-10 pr-4 rounded-full border border-stone-300 bg-white text-[14px] focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10">
        <div className="min-w-0 space-y-4">
          <EmailVerifyBanner />

          {/* Composer */}
          {user ? (
            <form onSubmit={publish} className="rounded-3xl border border-stone-200 bg-white p-5">
              <div className="flex gap-3">
                <Avatar name={user.name} src={user.avatarUrl} size={40} />
                <div className="flex-1 min-w-0">
                  <label htmlFor="compose" className="sr-only">
                    Share something with the community
                  </label>
                  <textarea
                    id="compose"
                    rows={asArticle && canArticle ? 10 : 3}
                    maxLength={asArticle && canArticle ? 20000 : 5000}
                    placeholder={asArticle && canArticle ? 'Write your article. At least 300 characters; cite sources for claims.' : 'Share a field observation or ask a question'}
                    className={textareaClass}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2 justify-between">
                    <label htmlFor="compose-topic" className="sr-only">
                      Topic
                    </label>
                    <select
                      id="compose-topic"
                      value={draftTopic}
                      onChange={(e) => setDraftTopic(e.target.value)}
                      className="h-10 px-4 rounded-full border border-stone-300 bg-white text-[13px]"
                    >
                      <option value="">Choose a topic</option>
                      {Object.entries(TOPIC_LABELS).map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </select>
                    {canArticle && (
                      <label className="flex items-center gap-2 text-[13px]">
                        <input type="checkbox" className="w-4 h-4 accent-[#141414]" checked={asArticle} onChange={(e) => setAsArticle(e.target.checked)} />
                        Publish as an article
                      </label>
                    )}
                    <Button type="submit" variant="lime" busy={posting} disabled={draft.trim().length < (asArticle && canArticle ? 300 : 2)}>
                      {asArticle && canArticle ? 'Publish article' : 'Post'}
                    </Button>
                  </div>
                  {composeError && <Notice tone="error" className="mt-3">{composeError}</Notice>}
                </div>
              </div>
            </form>
          ) : (
            <div className="rounded-3xl bg-ink text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[15px]">Join free to post, comment and follow topics.</p>
              <div className="flex gap-2">
                <Button variant="lime" onClick={() => onNavigate('auth:signup')}>
                  Create account
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => onNavigate('auth:login')}>
                  Log in
                </Button>
              </div>
            </div>
          )}

          {/* Tabs + topic filter */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {user &&
              tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setView(t.id)}
                  aria-pressed={view === t.id}
                  className={`h-9 px-4 rounded-full text-[13px] border transition-colors ${
                    view === t.id ? 'bg-ink border-ink text-white' : 'border-stone-300 hover:border-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            <label htmlFor="topic-filter" className="sr-only">
              Filter by topic
            </label>
            <select
              id="topic-filter"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-9 px-4 rounded-full border border-stone-300 bg-white text-[13px] ml-auto"
            >
              <option value="">All topics</option>
              {Object.entries(TOPIC_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {error && <Notice tone="error">{error}</Notice>}

          {!loading && !error && posts.length === 0 && (
            <div className="rounded-3xl border border-dashed border-stone-300 p-10 text-center">
              <p className="font-display text-[22px]">
                {view === 'saved' ? 'Nothing saved yet.' : view === 'following' ? 'Your feed is quiet.' : 'No posts here yet.'}
              </p>
              <p className="mt-2 text-[13px] text-slate-500">
                {view === 'saved'
                  ? 'Tap Save on any post to keep it here.'
                  : view === 'following'
                    ? 'Follow more topics on the right, or switch to Everything.'
                    : 'Be the first to post on this topic.'}
              </p>
            </div>
          )}

          {posts.map((p, i) => (
            <React.Fragment key={p.id}>
            {i === Math.min(3, posts.length - 1) && <SponsoredSlot placement="feed" topic={topic} onNavigate={onNavigate} />}
            <PostCard
              post={p}
              following={followedUsers}
              onChange={(np) => setPosts((list) => list.map((x) => (x.id === np.id ? np : x)))}
              onHideAuthor={(id) => setPosts((list) => list.filter((x) => x.author.id !== id))}
              onRemove={(id) => setPosts((list) => list.filter((x) => x.id !== id))}
              onToggleFollow={toggleUserFollow}
              onReport={setReportTarget}
              toast={setToastMsg}
              onRequireLogin={() => onNavigate('auth:login')}
            />
            </React.Fragment>
          ))}

          {loading && <p className="text-[13px] text-slate-500 py-6 text-center">Loading…</p>}
          {!loading && nextBefore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => load(nextBefore)}>
                Load more
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-28 self-start">
          <div className="rounded-3xl bg-mist p-6">
            <h2 className="text-[15px] font-medium">Topics</h2>
            <p className="text-[12px] text-slate-500 mt-1">{user ? 'Followed topics fill your For you feed.' : 'Log in to follow topics.'}</p>
            <ul className="mt-4 space-y-1">
              {Object.entries(TOPIC_LABELS).map(([k, l]) => {
                const on = followedTopics.includes(k);
                return (
                  <li key={k} className="flex items-center justify-between gap-2">
                    <button onClick={() => setTopic(topic === k ? '' : k)} className={`text-[13px] py-1.5 text-left hover:underline underline-offset-4 ${topic === k ? 'font-medium' : ''}`}>
                      #{l}
                    </button>
                    {user && (
                      <button
                        onClick={() => toggleTopicFollow(k)}
                        aria-pressed={on}
                        className={`h-7 px-3 rounded-full text-[11px] border transition-colors ${on ? 'bg-ink border-ink text-white' : 'border-stone-300 hover:border-ink'}`}
                      >
                        {on ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-3xl border border-stone-200 p-6 text-[12px] leading-relaxed text-slate-500">
            <p className="text-[13px] font-medium text-ink">Community guidelines</p>
            <p className="mt-2">
              Share what you’ve seen in the field, credit sources and never ask for payment to apply for a job. Report anything
              that looks like a scam. Sponsored posts are always labelled.
            </p>
          </div>
        </aside>
      </div>

      {reportTarget && (
        <ReportDialog
          target={reportTarget}
          onClose={() => setReportTarget(null)}
          onDone={(m) => {
            setReportTarget(null);
            setToastMsg(m);
          }}
        />
      )}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  );
};
