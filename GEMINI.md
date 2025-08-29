# GEMINI.md - Project Context

## Project Overview

This is a personal blog project named `maiiiiiid-blog`. It is built using **VuePress 2** and styled with the **`vuepress-theme-plume`**. The purpose of the site is to serve as a personal blog, knowledge base, and portfolio.

*   **Core Technology**: VuePress 2
*   **Theme**: `vuepress-theme-plume`
*   **Bundler**: Vite (as indicated by `@vuepress/bundler-vite`)
*   **Package Manager**: The presence of `pnpm-lock.yaml` suggests `pnpm` is the preferred package manager, though `npm` can also be used.

### Architecture

The project follows a standard VuePress structure:

*   **Content Root**: The `docs/` directory contains all markdown content.
*   **Configuration**: All VuePress and theme-specific configuration is located in `docs/.vuepress/`.
    *   `config.js`: Main configuration for the VuePress site.
    *   `navbar.js`: Defines the structure of the top navigation bar.
*   **Content Categories**: Blog posts and notes are organized into subdirectories under `docs/`, such as:
    *   `docs/posts/`
    *   `docs/mood/` (Diaries/Moods)
    *   `docs/web/` (Reading Notes)
    *   `docs/memo/` (Memos/Cheatsheets)

## Building and Running

Key commands are defined in `package.json`.

1.  **Install Dependencies**:
    ```sh
    # Recommended (due to pnpm-lock.yaml)
    pnpm install

    # Or with npm
    npm install
    ```

2.  **Run Development Server**:
    This command starts a local hot-reloading development server.
    ```sh
    npm run docs:dev
    ```

3.  **Build for Production**:
    This command compiles the Markdown files into a static website, ready for deployment.
    ```sh
    npm run docs:build
    ```

4.  **Preview Production Build**:
    After building, this command starts a local server to preview the production-ready site.
    ```sh
    npm run docs:preview
    ```

## Development Conventions

*   **Content Format**: All content is written in Markdown.
*   **Categorization**: To create a new content category, create a new subdirectory within `docs/`. For the theme to generate an article list page for that category (e.g., at the URL `/category/`), you must add a `README.md` file inside `docs/category/` with the following frontmatter:
    ```yaml
    ---
    title: Category Title
    description: "A description for the category."
    blog: true
    ---
    ```
*   **Navigation**: The main site navigation is managed centrally in the `docs/.vuepress/navbar.js` file.
*   **Homepage Customization**: The root `README.md` provides detailed instructions on how to build a highly customized homepage using Vue components, as supported by the `plume` theme.
*   **Internal Linking**: Within notes, use standard Markdown links. For cross-note linking where content embedding is desired, the context should be provided to the agent.
