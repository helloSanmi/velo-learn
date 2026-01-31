
import { GoogleGenAI, Type } from "@google/genai";
import { Task, User, TaskPriority, TaskStatus } from "../types";

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
              steps: { type: Type.ARRAY, items: { type: Type.STRING } }
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

  suggestTags: async (title: string, description: string): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this task and suggest 2-3 single-word professional enterprise tags.
        Title: ${title}
        Description: ${description}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["tags"]
          }
        }
      });
      const data = JSON.parse(response.text);
      return data.tags || [];
    } catch (error) {
      return ["Task"];
    }
  },

  draftTaskDescription: async (title: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Write a professional, structured enterprise task description for: "${title}". 
        Include:
        - Objective
        - Success Criteria
        - Resources Needed
        Use clean, concise formatting.`,
      });
      return response.text || "";
    } catch (error) {
      return "Strategic drafting failed. Please enter manual documentation.";
    }
  },

  predictRisk: async (task: Task): Promise<{ isAtRisk: boolean; reason: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Evaluate risk for: ${task.title}. Status: ${task.status}. Priority: ${task.priority}.`,
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

  suggestTriage: async (tasks: Task[]): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority }));
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Re-order these tasks into a logical execution queue based on priority and common-sense dependencies. Return only a JSON array of task IDs in the new order.
        Context: ${JSON.stringify(context)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      return tasks.map(t => t.id);
    }
  },

  chatWithBoard: async (history: { role: 'user' | 'model', content: string }[], tasks: Task[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const contents = history.map(msg => ({ role: msg.role, parts: [{ text: msg.content }] }));
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: { systemInstruction: "You are Velo AI Commander PM, a strategic enterprise orchestrator specialized in high-velocity task management." }
      });
      return response.text || "No response.";
    } catch (error) {
      return "Error connecting to Velo Core.";
    }
  },

  parseProjectFromDocument: async (docText: string): Promise<Array<{ title: string; description: string; priority: TaskPriority; tags: string[] }>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this document and extract 15-20 structured enterprise tasks.
        Document: ${docText.slice(0, 15000)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "description", "priority", "tags"]
                }
              }
            },
            required: ["tasks"]
          }
        }
      });
      const data = JSON.parse(response.text);
      return data.tasks || [];
    } catch (error) {
      return [];
    }
  },

  suggestWorkloadBalance: async (tasks: Task[], users: User[]): Promise<Array<{ taskId: string; fromUserId: string; toUserId: string; reason: string }>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = {
      users: users.map(u => ({ id: u.id, name: u.displayName })),
      tasks: tasks.filter(t => t.status !== TaskStatus.DONE).map(t => ({
        id: t.id,
        title: t.title,
        assigneeId: t.assigneeId,
        priority: t.priority
      }))
    };
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Balance team workload. Context: ${JSON.stringify(context)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    taskId: { type: Type.STRING },
                    fromUserId: { type: Type.STRING },
                    toUserId: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text).suggestions || [];
    } catch (error) {
      return [];
    }
  },

  suggestDueDate: async (title: string, subtasks: string[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suggest due date for: ${title}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { suggestedDate: { type: Type.STRING } },
            required: ["suggestedDate"]
          }
        }
      });
      return JSON.parse(response.text).suggestedDate;
    } catch (error) {
      return new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
    }
  },

  parseImageToTasks: async (base64Data: string, mimeType: string): Promise<{ title: string; description: string; subtasks: string[] }[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ inlineData: { data: base64Data, mimeType } }, { text: 'Extract tasks as JSON array.' }],
      });
      const text = response.text || "[]";
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      return [];
    }
  },

  getHealthInsights: async (tasks: Task[], users: User[]): Promise<{ bottlenecks: string[]; suggestions: string[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Project health audit: ${JSON.stringify(tasks.length)} tasks.`,
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
      return { bottlenecks: ["Unavailable"], suggestions: [] };
    }
  }
};
