@echo off
@rem 文件数量
set fileNum=20 
@rem 文件大小，下面的大小是1M，注意，命令所需的大小是字节
@rem 可以用这个工具 https://calc.itzmx.com/ 转换对应的字节
set fileSize=1048576
for /l %%i in (1,1,%fileNum%) do (
  @rem 注意如果文件名含有中文的话，一定要使用ANSI编码
  @rem 也就是在记事本里写bat脚本，写完记得更改文件后缀为bat，就可以了
  fsutil file createNew %%i.txt %fileSize%
)
echo success
pause