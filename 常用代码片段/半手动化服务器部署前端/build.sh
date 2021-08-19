#!/bin/sh
#半手动化，指的是你需要自己手动运行脚本+定时修改维护脚本
#都是根据自己的需求变动的（比如文件夹路径，所以需文件等等等...）
#所以这并不适合所有人（除我）,但是可以参考里面所用到的命令
#毕竟这是我第一个从0-1的shell脚本，所以遇到的知识点/坑还是蛮多的
goBuild(){
    arguments1=$1
    if [[ $arguments1 != '-produce' ]] && [[ $arguments1 != '-release' ]]; then
        echo "你输入的第一个参数为：【$arguments1】,参数错误，因为第一个参数的值只能是【-produce】或【-release】"
        return
    fi
    starTime=$(date +%s)
    #判断文件存在，判断是否为文件夹等
    rootPath='/test'
    targetPath="dcfile-web-dev"
    backupsPath="$rootPath/backups"
    backupsConfigPath="$backupsPath/config"

    # sysConsts.js
    backupsConfigProduceSysConstsPath="$backupsConfigPath/produce_sysConsts.js"
    backupsConfigReleaseSysConstsPath="$backupsConfigPath/release_sysConsts.js"
    targetSysConstsPath="$rootPath/$targetPath/build/config/sysConsts.js"

    # 旧的前端数据的备份存放路径
    backupsFrontendPath="$rootPath/backups/Frontend"
    # 新的前端数据的存放路径
    newFrontendPath="$rootPath/$targetPath/build"

    # 复制安卓，iso，pc的安卓包
    backupsConfigStaticFolderPath="$backupsConfigPath/static/*"
    targetStaticFolderPath="$rootPath/$targetPath/build/static"

    # 不同环境前端打包后存放的路径
    FrontendBuildProducePath="/var/www/html/xxxx_produce/Frontend"
    FrontendBuildReleasePath="/var/www/html/xxxx_release/Frontend"

    if [[ -d "$targetPath" ]]; then
     echo "文件夹存在，准备删除"
     cd "$rootPath/$targetPath"
     sleep 0.2s  #延迟0.2s
     rm -rf `ls|egrep -v '(node_modules)'`
     echo "文件夹：${targetPath}，已删除"
    else
     echo "文件夹不存在"
    fi
    cd $rootPath
    wget http://192.168.188.132:8992/proxy/xxxx/archive/dev.zip -O dev.zip
    wgetResult=$?
    if [[ $wgetResult != 0 ]]; then  
        echo "$wgetResult，下载错误，请自行检查接口返回是否正常"
        return
    fi
    #虽说解压的是名称的是dev.zip，
    #但是当解压出来后的文件夹名是dcfile-web-dev，
    #所以当上面判断dcfile-web-dev目录不存在，是不用自己创建的
    unzip -o dev.zip
    rm -rf dev.zip
    #替换文件内容命令
    sed -i 's/node scripts\/build.js/node --max_old_space_size=4096 scripts\/build.js/g' "$rootPath/$targetPath/package.json"
    cd $rootPath/$targetPath
    yarn
    npm run build
    \cp -rf $backupsConfigStaticFolderPath $targetStaticFolderPath
    time=$(date "+%Y%m%d%H%M%S")
    if [[ $arguments1 = '-produce' ]]; then
      echo "线上生产环境（produce）192.168.188.209"
      # 截取字符串
      # file="$backupsConfigPath/${arguments1: 1}_sysConsts.js"
      \cp -rf $backupsConfigProduceSysConstsPath $targetSysConstsPath
      zip -r "$backupsFrontendPath/Frontend_Back_$time.zip" $FrontendBuildProducePath
      if [[ -f "$backupsFrontendPath/Frontend_Back_$time.zip" ]]; then
        echo "旧的前端数据已备份，准备删除旧数据..."
        rm -rf $FrontendBuildProducePath/*
        deleteResult=$?
        echo "删除结果$deleteResult"
        if [[ $deleteResult = 0 ]]; then
            echo "旧的前端数据已删除"
            \cp -rf /$newFrontendPath/* $FrontendBuildProducePath
        else
            echo "旧的前端数据删除失败！"
        fi
      else
        echo "旧的前端数据未备份，请备份后继续"
      fi
    elif [[ $arguments1 = '-release' ]]; then
      echo "发布测试环境（release）192.168.188.231"
      \cp -rf $backupsConfigReleaseSysConstsPath $targetSysConstsPath
      zip -r "$backupsFrontendPath/Frontend_Back_$time.zip" $FrontendBuildReleasePath
      if [[ -f "$backupsFrontendPath/Frontend_Back_$time.zip" ]]; then
        echo "旧的前端数据已备份，准备删除旧数据..."
        rm -rf $FrontendBuildReleasePath/*
        #返回上一条命令的结果0表示成功，其他表示失败
        deleteResult=$?
        echo "删除结果$deleteResult"
        if [[ $deleteResult = 0 ]]; then
            echo "旧的前端数据已删除"
            \cp -rf /$newFrontendPath/* $FrontendBuildReleasePath
        else
            echo "旧的前端数据删除失败！"
        fi
      else
        echo "旧的前端数据未备份，请备份后继续"     
      fi 
    else
      echo "你输入的第一个参数为：【$arguments1】,参数错误，因为第一个参数的值只能是【-produce】或【-release】"
    fi
    oldFrontDataNum=`cd ${backupsFrontendPath} && ls -l |grep "^-"|wc -l`
    if [[ $oldFrontDataNum > 7 ]]; then
        echo "前端备份文件已达到【$oldFrontDataNum】个，请注意清理！！！"
    fi    
    endTime=$(date +%s)
    realTime=$(( $endTime - $starTime ))
    hour=$(( $realTime/3600 ))
    min=$(( ($realTime-${hour}*3600)/60 ))
    sec=$(( $realTime-${hour}*3600-${min}*60 ))
    echo "本次运行时间： ${hour}h:${min}m:${sec}s"
}
goBuild $1

#shell函数定义 https://www.runoob.com/linux/linux-shell-func.html
#在函数中可以用return结束当前的程序的执行，也就是return下面的代码都不会执行了
#而在其他地方的话，可以使用系统级的方法退出 exit(0)，可参考：Shell中exit和return的区别讲解https://www.jb51.net/article/159107.htm
#$? 获取上一条shell命令的返回结果。一般的约定是：0表示成功，非0表示失败。 https://zhidao.baidu.com/question/334834705773103085.html
#Shell脚本传参数方法以及怎么获取参数总结 https://www.jb51.net/article/65677.htm
#shell教程（4）变量（二）：字符串变量截取、替换和删除 https://blog.csdn.net/qq_42491125/article/details/101368505 http://c.biancheng.net/view/1120.html
#linux强制复制文件并覆盖的方法 https://blog.csdn.net/u012133048/article/details/94136464
#Linux的~/.bashrc文件介绍（一些系统的别名就是定义在这个文件里） https://blog.csdn.net/sexyluna/article/details/105964185
#zip命令怎样压缩文件，zip命令怎样压缩文件夹 https://jingyan.baidu.com/article/a24b33cd21bce619fe002bb2.html
#Linux的压缩/解压缩文件处理 zip & unzip https://www.cnblogs.com/huzixia/p/10393289.html
#shell脚本实现取当前时间 https://www.cnblogs.com/janezhao/p/9732157.html
#Linux wget 下载 文件到指定目录 https://www.cnblogs.com/brady-wang/p/12812458.html
#linux删除文件夹所有文件方法(排除指定文件或者目录)  https://blog.csdn.net/seulzz/article/details/102825385
#Linux替换文本内容的命令（sed） https://www.jianshu.com/p/ff599cc50882
#linux,shell中if else if的写法http://c.biancheng.net/view/1262.html ,判断文件（夹）是否存在，文本/数字比较 https://www.cnblogs.com/kairo/p/6646774.html
#shell中各种括号的作用详解()、(())、[]、[[]]、{} https://www.cnblogs.com/splendid/p/11201733.html
#Shell函数（向函数传递参数）http://blog.sina.com.cn/s/blog_6436b8ec0102xgjk.html
#shell运算(数字[加减乘除，比较大小]，字符串，文件) https://blog.csdn.net/shimazhuge/article/details/38703523
#shell中给出一个用秒表示的时间数，如何转换成时分秒表示的形式，如3600秒，如何表示成01:00:00的形式 https://zhidao.baidu.com/question/510765423.html
#Linux 中shell 脚本if判断多个条件 https://blog.csdn.net/weixin_37569048/article/details/80039941
#shell统计当前文件夹下的文件个数、目录个数 https://blog.csdn.net/weixin_44203158/article/details/109727981