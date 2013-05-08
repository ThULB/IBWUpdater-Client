#!/bin/bash
rm -rf ibwupd.zip
cd ..
zip -r --exclude=*.svn* --exclude=*.DS_Store* --exclude=*setup* --exclude=*.sh ./setup/ibwupd.zip *
cd setup