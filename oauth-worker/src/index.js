export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. 引导用户去 GitHub 授权
    if (url.pathname === "/auth") {
      return Response.redirect(
        `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=repo,user`,
        302
      );
    }

    // 2. GitHub 回调处理 (Callback)
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "accept": "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const result = await response.json();

      // 返回给 Decap CMS 的固定脚本格式
      return new Response(
        `
        <script>
          const receiveMessage = (message) => {
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify({
                token: result.access_token,
                provider: 'github',
              })}',
              message.origin
            );
            window.removeEventListener('message', receiveMessage, false);
          }
          window.addEventListener('message', receiveMessage, false);
          window.opener.postMessage("authorizing:github", "*");
        </script>
        `,
        { headers: { "content-type": "text/html" } }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
};