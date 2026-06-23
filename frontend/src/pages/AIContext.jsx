import { useEffect, useState } from "react";
import { API_BASE } from "../services/api";



export default function AIContext({
  darkMode
}) {

    const [context, setContext] =
        useState("");
    const [memoryEnabled, setMemoryEnabled] =
        useState(true);
    const [memoryLimit, setMemoryLimit] =
        useState(10);

  useEffect(() => {

    fetch(`${API_BASE}/settings`)
      .then(r => r.json())
      .then(data => {

        setContext(
            data.ai_context || ""
        );

        setMemoryEnabled(
            data.memory_enabled === "true"
        );

        setMemoryLimit(
            Number(
            data.memory_limit || 10
            )
        );

        });

  }, []);

  async function saveContext() {

    const settings =
      await fetch(
        `${API_BASE}/settings`
      ).then(r => r.json());

    settings.ai_context =
        context;
    settings.memory_enabled =
        String(memoryEnabled);

        settings.memory_limit =
        String(memoryLimit);

    await fetch(
      `${API_BASE}/settings`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(
            settings
          )
      }
    );

    alert(
      "AI Context Saved"
    );

  }

  return (
    <div>

      <h1
        className="text-3xl font-bold mb-6"
      >
        AI Context
      </h1>

      <textarea
        value={context}
        onChange={e =>
          setContext(
            e.target.value
          )
        }
        rows={12}
        className="
          w-full
          border
          rounded-xl
          p-4
        "
        placeholder="
You are Shubhanu's personal assistant.
He studies DSAI at IIIT Dharwad.
Keep replies concise.
"
      />
      <div className="mt-6">

        <h2 className="text-lg font-semibold mb-3">
            Memory Settings
        </h2>

        <label className="flex items-center gap-3 mb-4">

            <input
            type="checkbox"
            checked={memoryEnabled}
            onChange={e =>
                setMemoryEnabled(
                e.target.checked
                )
            }
            />

            <span>
            Enable Memory
            </span>

        </label>

        <div>

            <label className="block mb-2">
            Messages To Remember
            </label>

            <input
            type="number"
            min="1"
            max="50"
            value={memoryLimit}
            onChange={e =>
                setMemoryLimit(
                Number(
                    e.target.value
                )
                )
            }
            className="
                border
                rounded-lg
                px-3
                py-2
            "
            />

        </div>

        </div>

      <button
        onClick={saveContext}
        className="
          mt-4
          px-4
          py-2
          rounded-lg
          bg-green-600
          text-white
        "
      >
        Save Context
      </button>

    </div>
  );
}