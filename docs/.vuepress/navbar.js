import { defineNavbarConfig } from "vuepress-theme-plume";

export const navbar = defineNavbarConfig([
  { text: "首页", link: "/", icon: "material-symbols:home" },
  {
    text: "博客",
    link: "/blog/",
    icon: "material-symbols:article-outline",
    activeMatch: "^(/blog/|/article/)",
  },
  { text: "心情", link: "/mood/", icon: "emojione-monotone:two-hearts" },
  {
    text: "笔记",
    items: [
      { text: "读书笔记", link: "/books/", icon: "emojione-monotone:blue-book" },
      { text: "备忘录", link: "/memo/", icon: "emojione-monotone:memo" },
    ],
    icon: "ic:outline-note-alt",
    activeMatch: "^/(web|memo)/",
  },
  {
    text: "更多",
    items: [
      {
        text: "友情链接",
        link: "/more/friends/",
        icon: "icon-park:friends-circle",
      },
      {
        text: "我的项目",
        link: "/more/projects/",
        icon: "material-icon-theme:folder-project-open",
      },
    ],
    icon: "mingcute:more-3-fill",
    activeMatch: "^/more/",
  },
]);
