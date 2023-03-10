#!/bin/bash

useradd atlassian && usermod -a -G atlassian atlassian && mkdir /home/atlassian/jira9
mkdir /home/atlassian/jira9
mkdir /home/atlassian/confluence8
#wget https://www.atlassian.com/software/jira/downloads/binary/atlassian-jira-software-9.5.0.tar.gz
wget https://www.atlassian.com/software/jira/downloads/binary/atlassian-servicedesk-5.5.0.tar.gz
wget https://www.atlassian.com/software/confluence/downloads/binary/atlassian-confluence-8.0.2.tar.gz
mv atlassian-servicedesk-5.5.0.tar.gz /home/atlassian
mv atlassian-confluence-8.0.2.tar.gz /home/atlassian
su - atlassian -c 'tar xzvf atlassian-servicedesk-5.5.0.tar.gz'
su - atlassian -c 'tar xzvf atlassian-confluence-8.0.2.tar.gz'
chown -R atlassian:atlassian /home/atlassian
sed -i '2s/jira\.home =/jira\.home \= \/home\/atlassian\/jira9/' /home/atlassian/atlassian-jira-servicedesk-5.5.0-standalone/atlassian-jira/WEB-INF/classes/jira-application.properties
# Confluence
echo "confluence.home=/home/atlassian/confluence8" > /home/atlassian/atlassian-confluence-8.0.2/confluence/WEB-INF/classes/confluence-init.properties
# Install Java
amazon-linux-extras install java-openjdk11 -y
yum install java-1.8.0-openjdk -y
echo "export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-11.0.16.0.8-1.amzn2.0.1.x86_64" >>/etc/profile
alternatives --set java /usr/lib/jvm/java-11-openjdk-11.0.16.0.8-1.amzn2.0.1.x86_64/bin/java

su - atlassian -c '/home/atlassian/atlassian-jira-servicedesk-5.5.0-standalone/bin/start-jira.sh'
su - atlassian -c '/home/atlassian/atlassian-confluence-8.0.2/bin/start-confluence.sh'

