const GITHUB_API = 'https://api.github.com';

interface GitHubTreeItem {
  path: string;
  mode: '100644';
  type: 'blob';
  content: string;
}

/**
 * 创建 GitHub 仓库
 */
export async function createRepo(
  token: string,
  name: string,
  description: string
): Promise<string> {
  const res = await fetch(`${GITHUB_API}/user/repos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      name,
      description,
      private: false,
      auto_init: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to create repo: ${err.message}`);
  }

  const data = await res.json();
  return data.html_url as string;
}

/**
 * 推送文件到 GitHub 仓库
 * 使用 Git Data API：create tree → create commit → update ref
 */
export async function pushToGithub(
  token: string,
  repo: string, // "owner/repo"
  files: Record<string, string>
): Promise<string> {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
  };

  // 1. 获取默认分支的最新 commit SHA
  const refRes = await fetch(
    `${GITHUB_API}/repos/${repo}/git/ref/heads/main`,
    { headers }
  );
  if (!refRes.ok) {
    throw new Error('Failed to get ref. Make sure the repo exists and has a main branch.');
  }
  const refData = await refRes.json();
  const latestCommitSha: string = refData.object.sha;

  // 2. 获取该 commit 的 tree SHA
  const commitRes = await fetch(
    `${GITHUB_API}/repos/${repo}/git/commits/${latestCommitSha}`,
    { headers }
  );
  const commitData = await commitRes.json();
  const baseTreeSha: string = commitData.tree.sha;

  // 3. 创建新 tree
  const treeItems: GitHubTreeItem[] = Object.entries(files).map(
    ([path, content]) => ({
      path,
      mode: '100644' as const,
      type: 'blob' as const,
      content,
    })
  );

  const treeRes = await fetch(`${GITHUB_API}/repos/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  });
  if (!treeRes.ok) {
    throw new Error('Failed to create tree');
  }
  const treeData = await treeRes.json();

  // 4. 创建 commit
  const newCommitRes = await fetch(
    `${GITHUB_API}/repos/${repo}/git/commits`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: 'Deploy from AtomForge 🚀',
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    }
  );
  if (!newCommitRes.ok) {
    throw new Error('Failed to create commit');
  }
  const newCommitData = await newCommitRes.json();

  // 5. 更新 ref 指向新 commit
  const updateRefRes = await fetch(
    `${GITHUB_API}/repos/${repo}/git/refs/heads/main`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: newCommitData.sha }),
    }
  );
  if (!updateRefRes.ok) {
    throw new Error('Failed to update ref');
  }

  return `https://github.com/${repo}/commit/${newCommitData.sha}`;
}
