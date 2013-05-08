#!/bin/bash
rm -rf ibwupd.zip
zip -r --exclude=*.svn* --exclude=*.DS_Store* --exclude=*setup* --exclude=*.sh ./ibwupd.zip ../*