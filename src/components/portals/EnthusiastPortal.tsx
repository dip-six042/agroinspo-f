import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { useCurrency } from '../../context/CurrencyContext';
import {
  GraduationCap,
  Award,
  Briefcase,
  PlayCircle,
  ThumbsUp,
  MessageSquare,
  Share2,
  FileText,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface EnthusiastPortalProps {
  onOpenCreatorQuiz: () => void;
  onApplyJob: (job: any) => void;
}

export const EnthusiastPortal: React.FC<EnthusiastPortalProps> = ({ onOpenCreatorQuiz, onApplyJob }) => {
  const { currentUser, posts, toggleLikePost, createPost, events, jobs, jobApplications, registerForEvent } = useRole();
  const { formatMoney } = useCurrency();

  const [activeTab, setActiveTab] = useState<'feed' | 'jobs' | 'events' | 'profile'>('feed');
  const [newPostText, setNewPostText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('General Discussion');
  const [jobSearch, setJobSearch] = useState('');

  const isCreatorScreened =
    currentUser.verificationBadgeText?.includes('Creator') || currentUser.title.includes('Creator');

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    createPost(newPostText.trim(), selectedTopic);
    setNewPostText('');
  };

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.companyName.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.location.toLowerCase().includes(jobSearch.toLowerCase())
  );

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* Persona Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-normal text-[22px] tracking-[-0.015em] text-ink">{currentUser.name}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                {currentUser.verificationBadgeText || 'Enthusiast'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.title} · {currentUser.location}</p>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">{currentUser.bio}</p>
          </div>
        </div>

        {/* Creator Screening Callout */}
        <div className="shrink-0 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 max-w-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-900">
            <Award className="w-4 h-4 text-emerald-700" />
            <span>{isCreatorScreened ? 'Verified Creator Status' : 'Unlock Creator Publishing'}</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-snug">
            {isCreatorScreened
              ? 'You are authorized to publish educational articles and lead discussions across your approved tracks.'
              : 'Pass the topic agronomy quiz to earn publishing credentials and join verified discussions.'}
          </p>
          {!isCreatorScreened && (
            <button
              onClick={onOpenCreatorQuiz}
              className="w-full py-1.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full text-xs font-medium transition-colors"
            >
              Take Screening Quiz
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-[13px] font-medium overflow-x-auto whitespace-nowrap [scrollbar-width:none]" role="tablist">
        <button
          onClick={() => setActiveTab('feed')}
          className={`pb-3 transition-colors ${
            activeTab === 'feed'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Community Feed ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 transition-colors ${
            activeTab === 'jobs'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Job Marketplace ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 transition-colors ${
            activeTab === 'events'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Masterclasses & Replays ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 transition-colors ${
            activeTab === 'profile'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          My Applications ({jobApplications.length})
        </button>
      </div>

      {/* Tab 1: Community Feed */}
      {activeTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {/* Post Box */}
            <form onSubmit={handleCreatePost} className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="text-xs font-medium text-slate-800">
                  {isCreatorScreened ? 'Publish Educational Update' : 'Share Discussion / Learning Observation'}
                </span>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="text-xs py-1 px-2.5 rounded-lg border border-stone-200 bg-stone-50 text-slate-700"
                >
                  <option value="General Discussion">General Discussion</option>
                  <option value="Maize Agronomy">Maize Agronomy</option>
                  <option value="Poultry Science">Poultry Science</option>
                  <option value="Black Soldier Fly (BSF)">Black Soldier Fly (BSF)</option>
                  <option value="Solar Irrigation">Solar Irrigation</option>
                </select>
              </div>

              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Share a field trial insight, fertilizer trial observation, or ask a community question..."
                rows={3}
                className="w-full text-xs p-3 border border-stone-200 rounded-xl bg-stone-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  {isCreatorScreened ? 'Published with Screened Creator badge' : 'Community discussion mode'}
                </span>
                <button
                  type="submit"
                  disabled={!newPostText.trim()}
                  className="py-1.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full text-xs font-medium disabled:opacity-40 transition-colors"
                >
                  Post Update
                </button>
              </div>
            </form>

            {/* Posts List */}
            <div className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-10 h-10 rounded-full object-cover border border-stone-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-xs text-slate-900">{post.authorName}</h4>
                          {post.isSponsored && (
                            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                              Sponsored
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{post.authorTitle}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">{post.publishedAt}</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-body">
                    {post.content}
                  </p>

                  {post.image && (
                    <div className="rounded-xl overflow-hidden border border-stone-200 aspect-video">
                      <img src={post.image} alt={post.topic} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleLikePost(post.id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          post.isLiked ? 'text-emerald-700 font-medium' : 'hover:text-slate-800'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="font-mono-numbers">{post.likesCount}</span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-slate-800 transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="font-mono-numbers">{post.commentsCount}</span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-slate-800 transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="font-mono-numbers">{post.sharesCount}</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400">#{post.topic}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Recommended Jobs & Creator Status */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-medium text-xs text-slate-900 uppercase tracking-wider">
                  Top Agricultural Jobs
                </h4>
                <button onClick={() => setActiveTab('jobs')} className="text-xs text-emerald-800 hover:underline font-medium">
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {jobs.slice(0, 3).map((j) => (
                  <div key={j.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <h5 className="font-medium text-xs text-slate-900 line-clamp-1">{j.title}</h5>
                    <p className="text-[11px] text-slate-500">{j.companyName} · {j.location}</p>
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="font-mono-numbers text-emerald-800 font-medium">
                        {formatMoney(j.salaryMinNGN)}
                      </span>
                      <button
                        onClick={() => onApplyJob(j)}
                        className="text-emerald-800 hover:underline font-medium"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Jobs Marketplace */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Search job title, company, or state..."
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="text-xs text-slate-500 font-mono-numbers">
              Showing {filteredJobs.length} active vacancies
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-700/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                        {job.category}
                      </span>
                      <h3 className="font-display font-medium text-sm text-slate-900 mt-0.5">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {job.companyName} · {job.location}
                      </p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono-numbers font-medium border border-emerald-200/60">
                      {job.employmentType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {job.description}
                  </p>

                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-medium text-slate-700 block">Key Requirements:</span>
                    <ul className="space-y-0.5 text-[11px] text-slate-500 list-disc list-inside">
                      {job.requirements.slice(0, 2).map((req, idx) => (
                        <li key={idx} className="line-clamp-1">{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Remuneration</span>
                    <span className="text-xs font-semibold font-mono-numbers text-slate-900">
                      {formatMoney(job.salaryMinNGN)} – {formatMoney(job.salaryMaxNGN)} / {job.salaryPeriod}
                    </span>
                  </div>
                  <button
                    onClick={() => onApplyJob(job)}
                    className="py-1.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-medium transition-colors"
                  >
                    Apply for Free
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Events & Masterclasses */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-stone-100 text-slate-700 font-medium">
                    {evt.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono-numbers">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{evt.durationMinutes} mins</span>
                  </div>
                </div>

                <h3 className="font-display font-medium text-base text-slate-900 leading-snug">
                  {evt.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {evt.description}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <img
                    src={evt.hostAvatar}
                    alt={evt.hostName}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-900 block">{evt.hostName}</span>
                    <span className="text-[11px] text-slate-500">{evt.hostTitle}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs font-mono-numbers text-slate-500">
                  {evt.isReplayAvailable ? `${evt.replayViews} views recorded` : `${evt.attendeesCount} attendees registered`}
                </span>
                <button
                  onClick={() => registerForEvent(evt.id)}
                  className={`py-1.5 px-4 rounded-xl text-xs font-medium transition-colors ${
                    evt.isRegistered
                      ? 'bg-stone-200 text-slate-800'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                  }`}
                >
                  {evt.isRegistered ? 'Registered ✓' : evt.isReplayAvailable ? 'Play Recording' : 'Register Free'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: My Submitted Applications */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs space-y-4">
          <h3 className="font-display font-medium text-sm text-slate-900">
            Submitted Job Applications
          </h3>
          {jobApplications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              You have not applied for any vacancies yet. Explore the Job Marketplace to submit your profile.
            </div>
          ) : (
            <div className="space-y-3">
              {jobApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-medium text-slate-900">{app.jobTitle}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {app.companyName} · Submitted: {app.submittedAt}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1 italic">
                      "{app.experienceSummary}"
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
                    {app.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
