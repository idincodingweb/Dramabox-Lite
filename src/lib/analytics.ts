export async function logActivityToGAS(uid: string | null | undefined, action: string, item: string) {
  try {
    const webhookUrl = import.meta.env.VITE_GAS_WEBHOOK_URL;
    if (!webhookUrl) return;

    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify({
        action: "syncActivity",
        activity: { 
          uid: uid || "Anonymous", 
          action, 
          item 
        },
      }),
    });
  } catch (error) {
    console.error("Failed to log activity to GAS:", error);
  }
}
