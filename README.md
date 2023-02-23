# ddu-source-git_ref
`git_ref` source for `ddu.vim`

This source collects git refs (branchs and tags).

# Required
* [vim-denops/denops.vim](https://github.com/vim-denops/denops.vim)
* [Shougo/ddu.vim](https://github.com/Shougo/ddu.vim)
* [git/git](https://github.com/git/git)

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
