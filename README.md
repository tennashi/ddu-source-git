# ddu-source-git
`git` source for `ddu.vim`

This source collects various item by using `git` command.

# Required
* [vim-denops/denops.vim](https://github.com/vim-denops/denops.vim)
* [Shougo/ddu.vim](https://github.com/Shougo/ddu.vim)
* [git/git](https://github.com/git/git)

# Supported sources
* `git_ref`: `git show-ref`
* `git_status`: `git status`

# Supported actions
## `git_branch` kind
* `switch`: `git switch <branch_name>`
* `create`: `git branch <branch_name>`
* `tag`: `git tag <tag_name> <branch_name>`
* `delete`: `git branch --delete <branch_name>`
* `push`: `git push --set-upstream <remote_name> <branch_name>`
* `pull`: `git pull --set-upstream <remote_name> <branch_name>`

## `git_tag` kind
* `switch`: `git switch --detach <tag_name>`
* `create`: `git tag <tag_name>`
* `delete`: `git tag --delete <tag_name>`

## `git_index` kind
* `restoreStaged`: `git restore --staged <path>`
* `commitAll`: `git commit`

## `git_working_tree` kind
* `add`: `git add <path>`
* `restore`: `git restore <path>`

# Example
```vim
" Set default kind action.
call ddu#custom#patch_global({
\ 'kindOptions': {
\   'git_tag': {
\     'defaultAction': 'switch',
\   },
\   'git_branch': {
\     'defaultAction': 'switch',
\   },
\ },
\}

" Use git_ref source.
call ddu#start({'ui': 'ff', 'sources': [{'name': 'git_ref'}]})
```
