"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Send,
  BarChart3,
  Zap,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  templateType: string;
  subjectLine: string;
  isActive: boolean;
}

interface Campaign {
  id: string;
  campaignName: string;
  campaignType: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
}

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState("templates");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    templateType: "order_confirmation",
    subjectLine: "",
    htmlContent: "<p>Email content here</p>",
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      window.location.href = "/login";
      return;
    }
    setUserId(storedUserId);
    fetchData(storedUserId);
  }, []);

  const fetchData = async (userId) => {
    try {
      setIsLoading(true);
      const templateRes = await fetch("/api/email/templates?userId=" + userId);
      const campaignRes = await fetch("/api/email/campaigns?userId=" + userId);
      const templatesData = await templateRes.json();
      const campaignsData = await campaignRes.json();
      setTemplates(templatesData.data || []);
      setCampaigns(campaignsData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!userId || !newTemplate.name.trim() || !newTemplate.subjectLine.trim()) return;

    try {
      const response = await fetch("/api/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...newTemplate }),
      });

      if (response.ok) {
        setNewTemplate({
          name: "",
          templateType: "order_confirmation",
          subjectLine: "",
          htmlContent: "<p>Email content here</p>",
        });
        setIsCreatingTemplate(false);
        fetchData(userId);
      }
    } catch (error) {
      console.error("Error creating template:", error);
    }
  };

  const stats = {
    totalTemplates: templates.length,
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
    totalSent: campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0),
    openRate: 22.5,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading email module...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold dark:text-white">Email Marketing</h1>
          </div>
          <button
            onClick={() => setIsCreatingTemplate(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            <Plus className="h-5 w-5" />
            New Template
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Templates</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalTemplates}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.activeCampaigns}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sent</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalSent.toLocaleString()}</p>
              </div>
              <Send className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Open Rate</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.openRate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab("templates")}
                className={activeTab === "templates" ? "px-6 py-4 font-medium border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" : "px-6 py-4 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400"}
              >
                Templates ({stats.totalTemplates})
              </button>
              <button
                onClick={() => setActiveTab("campaigns")}
                className={activeTab === "campaigns" ? "px-6 py-4 font-medium border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" : "px-6 py-4 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400"}
              >
                Campaigns
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={activeTab === "logs" ? "px-6 py-4 font-medium border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" : "px-6 py-4 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400"}
              >
                Logs
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={activeTab === "analytics" ? "px-6 py-4 font-medium border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" : "px-6 py-4 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400"}
              >
                Analytics
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "templates" && (
              <div className="space-y-4">
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <div key={template.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold dark:text-white">{template.name}</h3>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Type: {template.templateType} | Subject: {template.subjectLine}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button className="rounded bg-blue-100 p-2 text-blue-600 hover:bg-blue-200">
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button className="rounded bg-red-100 p-2 text-red-600 hover:bg-red-200">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-600">No templates yet</p>
                )}
              </div>
            )}

            {activeTab === "campaigns" && (
              <div className="space-y-4">
                {campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold dark:text-white">{campaign.campaignName}</h3>
                          <div className="mt-2 flex gap-4 text-sm text-gray-600">
                            <span>Recipients: {campaign.recipientCount}</span>
                            <span>Sent: {campaign.sentCount}</span>
                            <span>Opened: {campaign.openedCount}</span>
                          </div>
                        </div>
                        <span className={campaign.status === "active" ? "rounded-full px-3 py-1 text-xs bg-green-100 text-green-800" : "rounded-full px-3 py-1 text-xs bg-gray-100 text-gray-800"}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-600">No campaigns yet</p>
                )}
              </div>
            )}

            {activeTab === "logs" && <p className="text-gray-600">Email delivery logs</p>}
            {activeTab === "analytics" && <p className="text-gray-600">Email analytics</p>}
          </div>
        </div>

        {isCreatingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold dark:text-white">Create Email Template</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Name</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="Template name"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Type</label>
                  <select
                    value={newTemplate.templateType}
                    onChange={(e) => setNewTemplate({ ...newTemplate, templateType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700"
                  >
                    <option value="order_confirmation">Order Confirmation</option>
                    <option value="promotional">Promotional</option>
                    <option value="newsletter">Newsletter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Subject</label>
                  <input
                    type="text"
                    value={newTemplate.subjectLine}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subjectLine: e.target.value })}
                    placeholder="Subject line"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTemplate}
                    className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreatingTemplate(false)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
