export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429 && i < retries - 1) {
      console.warn(`Rate limited. Retrying in ${delay * Math.pow(2, i)}ms...`);
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i))
      );
      continue;
    }
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response;
  }
  throw new Error("Max retries reached on 429");
}
