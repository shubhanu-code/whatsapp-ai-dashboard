import { useState, useEffect } from "react";
import { API_BASE } from "../services/api";
import {
  Sparkles,
  Database,
  Layers3
} from "lucide-react";




export default function Settings({ darkMode }) {
    const [activeTab,setActiveTab] = useState("ai");
    const [settings, setSettings] = useState({
        ai_context: "",
        ai_personality: "friendly",
        memory_enabled: true,
        memory_limit: 10,
        ai_model: "llama-3.1-8b-instant"
    });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {

    const res =
      await fetch(
        `${API_BASE}/settings`
      );

    const data =
      await res.json();

    setSettings(prev => ({
      ...prev,
      ...data
    }));
  }

  async function saveSettings() {

    await fetch(
      `${API_BASE}/settings`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify(settings)
      }
    );

    alert("Settings Saved");
  }

  return (
    <div
        className={`
            space-y-6
            ${
            darkMode
                ? "text-white"
                : ""
            }
        `}
        >

      <div>
        <h1 className="text-3xl font-bold">
            Settings
        </h1>

        <p
            className={`
                mt-1
                ${
                darkMode
                    ? "text-slate-400"
                    : "text-slate-500"
                }
            `}
            >
            Configure AI behavior, memory and model selection.
        </p>
        </div>

      <div
        className={`
            rounded-2xl
            p-6
            shadow
            ${
            darkMode
                ? "bg-[#111b21] border border-[#202c33]"
                : "bg-white"
            }
        `}
        >
        <div className="grid md:grid-cols-3 gap-3 mb-6">

            <button
                onClick={() =>
                setActiveTab("ai")
                }
                className={`
                    p-4
                    rounded-2xl
                    border
                    transition-all
                    text-left
                    ${
                        activeTab === "ai"
                            ? "bg-[#008069] text-white border-[#008069]"
                            : darkMode
                            ? "bg-[#202c33] border-[#2a3942] hover:border-[#008069] text-white"
                            : "bg-white border-slate-200 hover:border-[#008069]"
                        }
                    `}
            >
                <>
                    <Sparkles size={20} />
                    <div className="mt-2">
                        <div className="font-medium">
                            AI
                        </div>

                        <div className="text-xs opacity-70">
                            Context & Personality
                        </div>
                    </div>
                    </>
            </button>

            <button
                onClick={() =>
                setActiveTab("memory")
                }
                
                className={`
                    p-4
                    rounded-2xl
                    border
                    transition-all
                    text-left
                    ${
                        activeTab === "memory"
                            ? "bg-[#008069] text-white border-[#008069]"
                            : darkMode
                            ? "bg-[#202c33] border-[#2a3942] hover:border-[#008069] text-white"
                            : "bg-white border-slate-200 hover:border-[#008069]"
                        }
                `}
            >
            <>
                <Database size={20} />
                <div className="mt-2">
                    <div className="font-medium">
                        Memory
                    </div>

                    <div className="text-xs opacity-70">
                        Conversation Storage
                    </div>
                </div>
                </>
            </button>

            <button
                onClick={() =>
                setActiveTab("models")
                }
                className={`
                    p-4
                    rounded-2xl
                    border
                    transition-all
                    text-left
                    ${
                        activeTab === "models"
                            ? "bg-[#008069] text-white border-[#008069]"
                            : darkMode
                            ? "bg-[#202c33] border-[#2a3942] hover:border-[#008069] text-white"
                            : "bg-white border-slate-200 hover:border-[#008069]"
                        }
                `}
            >
            <>
            <Layers3 size={20} />
            <div className="mt-2">
                <div className="font-medium">
                    Models
                </div>

                <div className="text-xs opacity-70">
                    AI Providers
                </div>
            </div>
            </>
            </button>

            </div>

        {activeTab === "ai" && (

            <>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">
                        AI Context
                    </h2>

                    <p className="text-sm text-slate-500">
                        Define the assistant's personality and behavior.
                    </p>
                </div>

                <textarea
                rows={8}
                value={settings.ai_context}
                onChange={(e) =>
                    setSettings({
                    ...settings,
                    ai_context: e.target.value
                    })
                }
                className={`
                    w-full
                    rounded-xl
                    p-3
                    border
                    ${
                        darkMode
                        ? "bg-[#202c33] border-[#2a3942] text-white placeholder:text-slate-500"
                        : "bg-white border-slate-300"
                    }
                    `}
                placeholder="Global AI Context"
                />
                <div className="mt-6">

                    <h3 className="font-medium mb-3">
                        AI Personality
                    </h3>

                    <select
                        value={settings.ai_personality}
                        onChange={(e) =>
                        setSettings({
                            ...settings,
                            ai_personality: e.target.value
                        })
                        }
                        className={`
                        w-full
                        rounded-xl
                        p-3
                        border
                        ${
                            darkMode
                            ? "bg-[#202c33] border-[#2a3942] text-white"
                            : "bg-white border-slate-300"
                        }
                        `}
                    >
                        <option value="friendly">
                        Friendly
                        </option>

                        <option value="professional">
                        Professional
                        </option>

                        <option value="casual">
                        Casual
                        </option>

                        <option value="formal">
                        Formal
                        </option>

                        <option value="humorous">
                        Humorous
                        </option>
                    </select>

                    </div>
            </>

            )}
        {activeTab === "models" && (

            <>
                <h2 className="font-semibold mb-4">
                AI Model
                </h2>
                <p
                    className={`
                        text-sm mt-2
                        ${
                        darkMode
                            ? "text-slate-400"
                            : "text-slate-500"
                        }
                    `}
                    >
                    Current Model:
                    {" "}
                    {settings.ai_model}
                    </p>
                <select
                value={settings.ai_model}
                onChange={(e) =>
                    setSettings({
                    ...settings,
                    ai_model: e.target.value
                    })
                }
                className={`
                    w-full
                    rounded-xl
                    p-3
                    border
                    ${
                        darkMode
                        ? "bg-[#202c33] border-[#2a3942] text-white placeholder:text-slate-500"
                        : "bg-white border-slate-300"
                    }
                    `}
                >
                <option value="llama-3.1-8b-instant">
                    Llama 3.1 8B Instant
                </option>

                <option value="llama-3.3-70b-versatile">
                    Llama 3.3 70B
                </option>

                <option value="meta-llama/llama-4-scout-17b-16e-instruct">
                    Llama 4 Scout
                </option>

                </select>

            </>

            )}

      </div>

        {activeTab === "memory" && (
      <div
        className={`
            rounded-2xl
            p-6
            shadow
            ${
            darkMode
                ? "bg-[#111b21] border border-[#202c33]"
                : "bg-white"
            }
        `}
        >

        <h2 className="font-semibold mb-4">
          Memory Settings
        </h2>

        <label className="flex gap-3 items-center">

          <input
            type="checkbox"
            checked={
              settings.memory_enabled === true ||
              settings.memory_enabled === "true"
            }
            onChange={(e) =>
              setSettings({
                ...settings,
                memory_enabled:
                  e.target.checked
              })
            }
          />

          Enable Memory

        </label>

        <input
          type="number"
          value={
            settings.memory_limit
          }
          onChange={(e) =>
            setSettings({
              ...settings,
              memory_limit:
                e.target.value
            })
          }
          className={`
            w-full
            rounded-xl
            p-3
            border
            ${
                darkMode
                ? "bg-[#202c33] border-[#2a3942] text-white"
                : "bg-white border-slate-300"
            }
            `}
        />

      </div>
        )}

      <button
        onClick={saveSettings}
        className="
            bg-[#008069]
            hover:bg-[#006e5a]
            active:scale-[0.98]
            transition-all
            text-white
            px-6
            py-3
            rounded-xl
            font-medium
            shadow-sm
            "
        >
        Save Settings
      </button>

    </div>
  );
}