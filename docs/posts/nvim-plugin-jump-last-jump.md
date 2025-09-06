---
title: 在nvim中跳转到上次修改位置
createTime: 2025/09/06 10:53:17
permalink: /article/bv8m0k0k/
---
## 起因

在idea写代码的时候, 经常会有写着写着忘记某个方法参数或者具体实现，想要进入到源码中看下代码，但是有时候溯源堆栈太深，想要返回上次编写代码的位置时需要找半天。
这时ideavim就有个好用的功能，可以将idea自带的action绑定到ideavim的快捷键中。如比，我在`ideavim.rc`有如下配置：

```vimrc
nnoremap [c :action JumpToLastChange<CR>
nnoremap ]c :action JumpToNextChange<CR>
```

idea会记录字每次修改代码的位置，而这两行配置可以让我直接在修改代码的位置中跳转。遇到上面的情况时，我只需要按下`[c`即可跳转到上次代码修改位置。

使用ideavim跳转到上次修改位置很方便，但是nvim中貌似没有现成的解决方案。
nvim的`g,`、`g;`只允许跳转到当前buffer中修改的位置。实际上`:changes`命令也只会记录当前buffer修改的line、col、text信息，本质上时不支持跨buffer的。

于是想着：干脆自己写个插件吧。

## JumpLastChange 插件

在简单学习了lua语法后, 于是便有了下面代码：

```lua
local M = {}
local history = {}
local max_items = 100
local index = 0

local function clamp(val, min, max)
  if val < min then return min end
  if val > max then return max end
  return val
end

local function push_edit()
  local file = vim.api.nvim_buf_get_name(0)
  if file == "" then return end
  local pos = vim.api.nvim_win_get_cursor(0)
  local last = history[#history]

  if last and last.file == file and math.abs(last.pos[1] - pos[1]) <= 3 then
    return -- 避免重复
  end

  table.insert(history, { file = file, pos = pos })
  if #history > max_items then
    table.remove(history, 1)
  end
  index = #history + 1
end

-- 跳转
function M.jump_to(item)
  vim.cmd("edit " .. item.file)
  local line_count = vim.api.nvim_buf_line_count(0)
  -- 确保 pos 是一个包含行和列的表
  local line = type(item.pos) == "table" and item.pos[1] or item.pos
  local col = type(item.pos) == "table" and (item.pos[2] or 0) or 0
  -- 确保 line 是数字
  if type(line) ~= "number" then
    line = 1
  end
  line = clamp(line, 1, line_count)
  vim.api.nvim_win_set_cursor(0, { line, col })
end

function M.jump_prev()
  if index > 1 then
    index = index - 1
    M.jump_to(history[index])
  else
    print("No previous edit")
  end
end

function M.jump_next()
  if index < #history then
    index = index + 1
    M.jump_to(history[index])
  else
    print("No next edit")
  end
end

-- 新增: 显示历史
function M.show_history()
  if #history == 0 then
    print("No history yet")
    return
  end

  local items = {}
  for _, h in ipairs(history) do
    table.insert(items, string.format("%s:%d", h.file, h.pos[1]))
  end

  vim.ui.select(items, { prompt = "Jump to edit:" }, function(choice, idx)
    if choice and history[idx] then
      M.jump_to(history[idx])
    end
  end)
end

-- 自动收集
vim.api.nvim_create_autocmd({ "TextChanged", "TextChangedI" }, {
  callback = push_edit,
})

-- 注册命令
vim.api.nvim_create_user_command("ChangeHistory", M.show_history, {})

return M
```

上面代码基本实现了跳转上\下次修改位置，显示历史修改位置。实际使用起来还有点小问题，如果在terminal buffer的修改也会记录进去，但是日常使用影响不大，姑且先就这样吧。
