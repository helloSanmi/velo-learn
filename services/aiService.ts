
import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskPriority, User } from "../types";

export const aiService = {
  breakDownTask: async (title: string, description: string): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Break down the following task into 3-5 concise actionable steps:
        Title: ${title}
        Description: ${description}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["steps"]
          }
        }
      });

      const data = JSON.parse(response.text);
      return data.steps || [];
    } catch (error) {
      console.error("AI Generation Error:", error);
      return ["Failed to generate suggestions."];
    }
  },

  predictRisk: async (task: Task): Promise<{ isAtRisk: boolean; reason: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Evaluate if this task is 'At Risk' of delay or failure.
        Title: ${task.title}
        Status: ${task.status}
        Priority: ${task.priority}
        Subtasks: ${task.subtasks.map(s => `${s.title} (${s.isCompleted ? 'Done' : 'Pending'})`).join(', ')}
        Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isAtRisk: { type: Type.BOOLEAN },
              reason: { type: Type.STRING }
            },
            required: ["isAtRisk", "reason"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      return { isAtRisk: false, reason: "" };
    }
  },

  suggestDueDate: async (title: string, subtasks: string[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on task complexity, suggest a realistic due date starting from today (${new Date().toLocaleDateString()}). 
        Task: ${title}
        Steps: ${subtasks.join(', ')}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
              reasoning: { type: Type.STRING }
            },
            required: ["suggestedDate"]
          }
        }
      });
      return JSON.parse(response.text).suggestedDate;
    } catch (error) {
      return new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]; // Default 3 days
    }
  },

  parseImageToTasks: async (base64Data: string, mimeType: string): Promise<{ title: string; description: string; subtasks: string[] }[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      // NOTE: gemini-2.5-flash-image (nano banana series) does not support responseMimeType or responseSchema.
      // We must rely on clear prompting and manual text parsing.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: 'Analyze this image (could be a whiteboard, notebook, or screenshot). Extract all identified tasks and their specific sub-steps. Return the result as a raw JSON array of objects with "title", "description", and "subtasks" (array of strings) fields. Do not include markdown formatting or any other text.',
          },
        ],
      });
      
      const text = response.text || "[]";
      // Clean up potential markdown blocks in case instructions were bypassed
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Vision Parse Error:", error);
      return [];
    }
  },

  getHealthInsights: async (tasks: Task[], users: User[]): Promise<{ bottlenecks: string[]; suggestions: string[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Deeper context including historical audit logs to detect burnout/stagnation
    const context = {
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee: users.find(u => u.id === t.assigneeId)?.username || 'Unassigned',
        // Fix: Changed 'a.username' to 'a.displayName' as AuditEntry does not contain a 'username' property.
        history: t.auditLog?.slice(-5).map(a => `${a.displayName}: ${a.action} at ${new Date(a.timestamp).toLocaleDateString()}`),
        subtasksProgress: `${t.subtasks.filter(s => s.isCompleted).length}/${t.subtasks.length}`
      })),
      users: users.map(u => ({ id: u.id, name: u.username }))
    };

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Perform a deep Project Health Audit analyzing the historical audit logs and current task distribution.
        1. Identify resource bottlenecks (e.g., a specific user like 'Sarah Chen' having 80% of high-priority tasks).
        2. Detect stagnating tasks (moved into Progress but no updates in audit logs).
        3. Provide proactive suggestions for rebalancing assignments or realistic scheduling.
        Context: ${JSON.stringify(context)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bottlenecks: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["bottlenecks", "suggestions"]
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Health Audit Error:", error);
      return { bottlenecks: ["Unable to analyze board history at this time."], suggestions: [] };
    }
  },

  queryBoard: async (query: string, tasks: Task[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = tasks.map(t => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      risk: t.isAtRisk ? 'Yes' : 'No'
    }));

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Executive Summary for: ${query}
        Context: ${JSON.stringify(context)}`,
        config: {
          systemInstruction: "You are an Enterprise AI Project Manager. Provide analytical, data-driven summaries. Highlight risks specifically.",
        }
      });
      return response.text || "No analysis available.";
    } catch (error) {
      return "Error analyzing data.";
    }
  }
};
