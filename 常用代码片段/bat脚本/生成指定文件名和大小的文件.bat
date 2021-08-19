@echo off
@rem 文件名，注意，如果变量名含有中文的话，一定要使用ANSI编码
@rem 也就是在记事本里写bat脚本，写完记得更改文件后缀为bat，就可以了
set fileName="fileName.txt"
@rem 文件大小，下面的大小是1M，注意，命令所需的大小是字节
@rem 可以用这个工具 https://calc.itzmx.com/ 转换对应的字节
set fileSize=524288000
fsutil file createNew %fileName% %fileSize%
echo success
pause