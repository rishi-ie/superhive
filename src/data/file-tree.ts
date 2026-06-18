export type TreeNode = {
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
};

export const fileTree: TreeNode[] = [
  {
    name: 'src',
    type: 'folder',
    children: [
      {
        name: 'components',
        type: 'folder',
        children: [
          { name: 'Button.tsx', type: 'file' },
          { name: 'Input.tsx', type: 'file' },
          { name: 'Dialog.tsx', type: 'file' },
        ],
      },
      {
        name: 'hooks',
        type: 'folder',
        children: [
          { name: 'useAuth.ts', type: 'file' },
          { name: 'useTheme.ts', type: 'file' },
        ],
      },
      { name: 'App.tsx', type: 'file' },
      { name: 'main.tsx', type: 'file' },
    ],
  },
  { name: 'package.json', type: 'file' },
  { name: 'README.md', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
];
