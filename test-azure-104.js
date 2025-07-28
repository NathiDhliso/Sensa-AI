import fetch from 'node-fetch';

const SUPABASE_URL = 'https://okvdirskoukqnjzqsowb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdmRpcnNrb3VrcW5qenFzb3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1ODQxNjQsImV4cCI6MjA2NjE2MDE2NH0.k2q9Zb0mT53xrZIH5v5MN_to6knZIrjfhRWI-HDyZQo';

const AZURE_104_OBJECTIVES = `Manage Azure identities and governance (20–25%)
Manage Microsoft Entra users and groups
Create users and groups
Manage user and group properties
Manage licenses in Microsoft Entra ID
Manage external users
Configure self-service password reset (SSPR)
Manage access to Azure resources
Manage built-in Azure roles
Assign roles at different scopes
Interpret access assignments
Manage Azure subscriptions and governance
Implement and manage Azure Policy
Configure resource locks
Apply and manage tags on resources
Manage resource groups
Manage subscriptions
Manage costs by using alerts, budgets, and Azure Advisor recommendations
Configure management groups

Implement and manage storage (15–20%)
Configure access to storage
Configure Azure Storage firewalls and virtual networks
Create and use shared access signature (SAS) tokens
Configure stored access policies
Manage access keys
Configure identity-based access for Azure Files
Configure and manage storage accounts
Create and configure storage accounts
Configure Azure Storage redundancy
Configure object replication
Configure storage account encryption
Manage data by using Azure Storage Explorer and AzCopy
Configure Azure Files and Azure Blob Storage
Create and configure a file share in Azure Storage
Create and configure a container in Blob Storage
Configure storage tiers
Configure soft delete for blobs and containers
Configure snapshots and soft delete for Azure Files
Configure blob lifecycle management
Configure blob versioning

Deploy and manage Azure compute resources (20–25%)
Automate deployment of resources by using Azure Resource Manager (ARM) templates or Bicep files
Interpret an Azure Resource Manager template or a Bicep file
Modify an existing Azure Resource Manager template
Modify an existing Bicep file
Deploy resources by using an Azure Resource Manager template or a Bicep file
Export a deployment as an Azure Resource Manager template or convert an Azure Resource Manager template to a Bicep file
Create and configure virtual machines
Create a virtual machine
Configure Azure Disk Encryption
Move a virtual machine to another resource group, subscription, or region
Manage virtual machine sizes
Manage virtual machine disks
Deploy virtual machines to availability zones and availability sets
Deploy and configure an Azure Virtual Machine Scale Sets
Provision and manage containers in the Azure portal
Create and manage an Azure container registry
Provision a container by using Azure Container Instances
Provision a container by using Azure Container Apps
Manage sizing and scaling for containers, including Azure Container Instances and Azure Container Apps
Create and configure Azure App Service
Provision an App Service plan
Configure scaling for an App Service plan
Create an App Service
Configure certificates and Transport Layer Security (TLS) for an App Service
Map an existing custom DNS name to an App Service
Configure backup for an App Service
Configure networking settings for an App Service
Configure deployment slots for an App Service

Implement and manage virtual networking (15–20%)
Configure and manage virtual networks in Azure
Create and configure virtual networks and subnets
Create and configure virtual network peering
Configure public IP addresses
Configure user-defined network routes
Troubleshoot network connectivity
Configure secure access to virtual networks
Create and configure network security groups (NSGs) and application security groups
Evaluate effective security rules in NSGs
Implement Azure Bastion
Configure service endpoints for Azure platform as a service (PaaS)
Configure private endpoints for Azure PaaS
Configure name resolution and load balancing
Configure Azure DNS
Configure an internal or public load balancer
Troubleshoot load balancing

Monitor and maintain Azure resources (10–15%)
Monitor resources in Azure
Interpret metrics in Azure Monitor
Configure log settings in Azure Monitor
Query and analyze logs in Azure Monitor
Set up alert rules, action groups, and alert processing rules in Azure Monitor
Configure and interpret monitoring of virtual machines, storage accounts, and networks by using Azure Monitor Insights
Use Azure Network Watcher and Connection Monitor
Implement backup and recovery
Create a Recovery Services vault
Create an Azure Backup vault
Create and configure a backup policy
Perform backup and restore operations by using Azure Backup
Configure Azure Site Recovery for Azure resources
Perform a failover to a secondary region by using Site Recovery
Configure and interpret reports and alerts for backups`;

async function testAzure104StudyMap() {
    console.log('🎯 Testing Azure 104 Study Map Generation...\n');
    
    try {
        const url = `${SUPABASE_URL}/functions/v1/adk-agents`;
        const payload = {
            agent_type: 'orchestrator',
            task: 'epistemic_driver_generation',
            payload: {
                subject: 'Azure 104',
                objectives: AZURE_104_OBJECTIVES
            }
        };
        
        console.log('📤 Request URL:', url);
        console.log('📤 Subject:', payload.payload.subject);
        console.log('📤 Objectives length:', payload.payload.objectives.length, 'characters');
        console.log('📤 Starting request...\n');
        
        const startTime = Date.now();
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(payload)
        });
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`📥 Response received in ${duration}s`);
        console.log('📥 Response status:', response.status);
        
        const responseText = await response.text();
        console.log('📥 Response length:', responseText.length, 'characters');
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('\n✅ Azure 104 Study Map Generation Success!');
                console.log('📊 Response structure:');
                console.log('  - Success:', data.success);
                console.log('  - Request ID:', data.request_id);
                console.log('  - Processing Time:', data.metadata?.processingTime?.formatted || 'N/A');
                
                if (data.data) {
                    console.log('\n📋 Study Map Content:');
                    console.log('  - Epistemological Drivers:', data.data.epistemological_drivers?.points?.length || 0, 'points');
                    console.log('  - Learning Paths:', data.data.learning_paths?.length || 0, 'domains');
                    console.log('  - Connecting Link:', data.data.connecting_link ? 'Present' : 'Missing');
                    
                    if (data.data.learning_paths && data.data.learning_paths.length > 0) {
                        console.log('\n🎯 Learning Path Domains:');
                        data.data.learning_paths.forEach((path, index) => {
                            console.log(`  ${index + 1}. ${path.domain}`);
                            console.log(`     - Methodology points: ${path.methodology?.points?.length || 0}`);
                            console.log(`     - Application points: ${path.application?.points?.length || 0}`);
                        });
                    }
                    
                    // Show first epistemological driver as sample
                    if (data.data.epistemological_drivers?.points?.[0]) {
                        console.log('\n📝 Sample Epistemological Driver:');
                        const firstDriver = data.data.epistemological_drivers.points[0];
                        console.log(`  Type: ${firstDriver.type}`);
                        console.log(`  Content: ${firstDriver.content.substring(0, 100)}...`);
                    }
                }
                
            } catch (parseError) {
                console.log('❌ JSON parse error:', parseError.message);
                console.log('📝 Raw response preview:', responseText.substring(0, 500) + '...');
            }
        } else {
            console.log('❌ Azure 104 Study Map Generation Failed');
            console.log('📝 Error response:', responseText);
        }
        
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
}

// Run the test
testAzure104StudyMap().catch(console.error);
