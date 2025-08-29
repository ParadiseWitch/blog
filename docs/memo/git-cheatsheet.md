---
title: Git 备忘
tags:
  - Memo
  - Git
  - Tech
createTime: 2025/08/29 23:23:48
permalink: /article/d6vjc6g2/
---
[Git和Svn的区别](https://www.notion.so/Git-Svn-6390afb5097d4dda9b933e730121b445?pvs=21) 

[一些git脚本](https://www.notion.so/git-74e087a34d7a407ca375c92745676ee3?pvs=21) 

# Git不设置跟踪

在使用git的时候，有些文件是不需要上传的，所以就可以修改 `.gitignore` 



将需要忽略的文件加入到.gitignore文件中可使文件不受版本控制，避免不需要加入到版本分支的文件提交
需要注意的是只有未被加入到版本管理的文件(IDEA中文件颜色为红色)，并且版本分子中无此文件才能起作用
同样的`.gitignore`文件也是只对未被加入到版本管理的文件有效

如果是对所有文件都取消跟踪的话，就是
- `git rm -r --cached`    //不删除本地文件
- `git rm -r --f`            //删除本地文件,  f表示强制执行

`git rm --cached`
： 从索引中删除文件。但是本地文件还存在， 只是不希望这个文件被版本控制。

`git rm`
： 同时从工作区和索引中删除文件。即本地的文件也被删除了。

对某个文件取消跟踪（对已经跟踪的文件无效）

- `git rm --cached readme1.txt`   删除readme1.txt的跟踪，并保留在本地。
- `git rm --f readme1.txt`             删除readme1.txt的跟踪，并且删除本地文件。

# Git设置上流分支

```lua
[core]
	repositoryformatversion = 0
	filemode = false
	bare = false
	logallrefupdates = true
	symlinks = false
	ignorecase = true
[submodule]
	active = .
[remote "origin"]
	url = https://gitee.com/Maiiiiiid/changgou_Mall.git
	url = git@github.com:ParadiseWitch/changgou_Mall.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "master"]
	remote = origin
	merge = refs/heads/master
```

`git push origin maseter` 就会同步push到gitee和github 的两个库

---

# 本地分支和上游分支HEAD不一致
## 问题情形
```sh
637b1a5 (上游HEAD)
    |
92c171a8 - cd351a6a7 (本地分支HEAD)
```
为了让本地分支和上游保持一致，可以使用rebase、merge
## rebase

```sh
# 1. 先同步远程分支
git fetch origin
# 2. 将本地分支head变基到远程的head上
git rebase origin/main
```
操作完成后：
```
637b1a5（新上游head）
｜
92c171a8 --- cd351a6a7（重写后的本地HEAD commit）
```

## merge

```sh
# 1. 先同步远程分支
git fetch origin
# 2. 合并上游HEAD和本地HEAD的两个提交，合并为一个新提交
git merge origin/main
```

```
637b1a5（上游head）
｜---------
92c171a8 --- cd351a6a7 --- merge-commit（本地head）
```




[Git筆記] 如何移除 remote origin


> ❓  
> 當你將本機端的 Git 加入到遠端的 repository 像是 GitHub …等，若之後你又另外建立新的的 repository 或是要將它搬移至其他遠端數據庫例如 GitLab。此時要刪除原本的 remote origin 該怎麼做？


## **解決方法**

1 . Change the URI (URL) for a remote Git repository

第一個方法直接用指令修改 remote 遠端數據庫的位置(URL)

`git remote set-url origin git://new.url.here`

2 . Delete remove origin

第二個方法是使用指令刪除舊有的 remote

To remove a remote:

`git remote remove origin`

To add a remote:

`git remote add origin yourRemoteUrl`

Finally

`git push -u origin master`


# Git只克隆远程仓库的某一个目录或文件
## 稀疏克隆 #待验证
过滤掉Blob文件，可以减少git克隆时的下载量。
```sh
# 过滤掉blob文件
git clone --filter=blob:none --sparse <your-git-url>
```
`--filter=blob:none`：指定克隆过程中不包含任何 blob 对象（文件内容），只克隆 commit 对象、tree 对象、tag 对象。这可以大大减少克隆操作所需要的时间和存储空间，特别适用于大型仓库，减少不必要的数据传输和占用空间。

`--sparse`：该参数告诉 Git 使用稀疏（sparse）克隆的方式来克隆仓库。稀疏克隆是一种仅克隆部分文件和目录的方式，而不是将整个仓库都完整地克隆下来，有助于减少克隆所需的时间和空间。 

该命令的含义是开启git稀疏克隆，并下载除了具体的文件内容Blob对象之外的其他对象文件，包括tree对象、commit对象、tag对象，以保证git历史记录和项目目录结构的完整性。这样可以实现快速、高效地克隆大型仓库，并节省存储空间。在过滤掉Blob文件后，只包含了一小部分文件，整个克隆下载的来的项目大小只有428k。但是并没有包含我们需要的目录或文件。


## 指定拉取(sparse-checkout) #待验证
使用git sparse-checkout命令来指定从git远程仓库拉取我们所需要的目录或文件到工作目录中，执行以下命令：
```sh
# 指定git拉取的目录文件
git sparse-checkout add <your-folder>
# 或者
git sparse-checkout set <your-folder>
```

或者：
```sh
# 1. 克隆整个仓库：
git clone --no-checkout <repository-url>
cd <repository-name>
# 2. 启用稀疏检出：
git config core.sparseCheckout true
# 3. 添加要检出的文件夹： 在仓库根目录下，创建或编辑 .git/info/sparse-checkout 文件，添加你想要检出的文件夹路径。例如，假设你要检出 folder_name 文件夹：
folder_name/*
# 4. 检出所需的文件夹：
git checkout <branch-name>
```
这样，你就只会检出指定的文件夹，而不需要下载整个仓库。


# git archive
如果你有权限访问远程仓库，可以使用 git archive 命令来创建特定文件夹的压缩包：
```bash
git archive --remote=<repository-url> HEAD:path/to/folder | tar -x
```
这将从远程仓库提取指定文件夹并解压到当前目录。

# [Git怎样合并最近两次提交](https://www.dazhuanlan.com/2019/11/14/5dcd1d99e7cf2/)

```
git rebase -i HEAD~2
把第二个“pick”改成“squash”
:wq
:wq
```

> 如果commit已经push到远程，最好就不要再去合并了，否则会比较麻烦，老老实实再提交commit吧
#git
> 

# git commit 新修改的内容 添加到上次提交中 减少提交的日志

```
git commit --amend  # 会通过 core.editor 指定的编辑器进行编辑
git commit --amend --no-edit   # 不会进入编辑器，直接进行提交
```

# 更换到分支的最后一个稳定版本（最后一个tag）

```bash
git checkout $(git rev-list --tags --max-count=1)
```

# git可视化命令

```bash
git log --graph --oneline --all
```

# 部分clone

只克隆下包含最近一次commit的一个分支

一般仓库文件不大时，我们都可以用这个方法git clone仓库，但问题是有时候，在仓库历史的某次commit时，有人不小心提交了1G的文件，虽然后面的commit中他把这个文件删除了，但是在.git文件夹中仍然存储着这个文件，所以如果我们克隆仓库这个仓库，会把所有的历史协作记录都clone下来，这样整个文件会非常大，其实对于我们直接使用仓库，而不是参与仓库工作的人来说，只要把最近的一次commit给clone下来就好了。这就好比一个产品有很多个版本，我们只要clone最近的一个版本来使用就行了。实现这个功能就需要用到git clone --depth=1命令

```bash
git clone --depth 1 https://github.com/labuladong/fucking-algorithm.git
```

只克隆某个指定分支的最近一次commit

```bash
git clone --depth 1  --branch english https://github.com/labuladong/fucking-algorithm.git
```

- 用 git clone --depth=1 的好处是限制 clone 的深度，不会下载 Git 协作的历史记录，这样可以大大加快克隆的速度
- depth用于指定克隆深度，为1即表示只克隆最近一次commit
- 适合用 git clone --depth=1 的场景：你只是想clone最新版本来使用或学习，而不是参与整个项目的开发工作


## 设置 Git 使用 `nvim` 作为编辑器、diff 工具 和 merge 工具

### 🖊️ 设置 `nvim` 为默认编辑器（编辑 commit message）
```sh
git config --global core.editor "nvim"
```

### 🔍 设置 `nvim` 为 diff 工具

```sh
git config --global diff.tool nvimdiff 
git config --global difftool.nvimdiff.cmd 'nvim -d "$LOCAL" "$REMOTE"'
git config --global difftool.prompt false
```

### 🔧 设置 `nvim` 为 merge 工具
```sh
git config --global merge.tool nvimdiff 
git config --global mergetool.nvimdiff.cmd 'nvim -d "$LOCAL" "$BASE" "$REMOTE" -c "wincmd w"'
git config --global mergetool.prompt false
```

# 🔗相关链接
[Git 的故事：這一次沒這麼好玩 | 軟體考古學家 (brachiosoft.com)](https://blog.brachiosoft.com/posts/git/)
介绍.git文件夹下各个部分作用：
    [Inside .git (jvns.ca)](https://jvns.ca/blog/2024/01/26/inside-git/)
- [自己动手写 Git](https://wyag-zh.hanyujie.xyz/)

# #🍄 
```ps
PS E:\myproject\test-git> python -m venv venv
PS E:\myproject\test-git> 
PS E:\myproject\test-git> echo "venv" >> .gitignore
PS E:\myproject\test-git> git init
Initialized empty Git repository in E:/myproject/test-git/.git/
PS E:\myproject\test-git> git status
On branch master

No commits yet

Untracked files:
        (use "git add <file>..." to include in what will be committed)
                .gitignore
                venv/

nothing added to commit but untracked files present (use "git add" to track)
```
为什么venv仍然被track了

# ✨小技巧
- 小技巧：`git diff | base64` 然后 `base64 -d | git apply -` 可以避免复制出来空格/缩进之类的乱掉。 [来源](https://x.com/lcMenci/status/1940731465471566244)
	- 这个技巧的核心思路是：把容易被破坏的 diff 变成安全的纯文本编码格式（base64），再解码还原并应用补丁。
	- 非常适合：
		- 跨平台/跨终端/跨工具的 diff 分享
		- 发补丁给别人 review、测试
		- 临时保存小的变更片段

```