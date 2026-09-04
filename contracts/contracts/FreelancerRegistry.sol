// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FreelancerRegistry {
    struct Profile {
        address freelancer;
        string name;
        string title;
        string domain;
        uint256 hourlyRate;  // USD cents, e.g. 300 = $3/hr
        string bio;
        string portfolioUrl;
        string githubUrl;
        string skills;       // comma-separated, e.g. "Solidity,React,TypeScript"
        bool kycVerified;
        uint256 createdAt;
        bool exists;
    }

    mapping(address => Profile) public profiles;
    address[] private _freelancerList;

    event FreelancerRegistered(address indexed freelancer, string name);
    event FreelancerUpdated(address indexed freelancer, string name);

    function registerOrUpdate(
        string calldata name,
        string calldata title,
        string calldata domain,
        uint256 hourlyRate,
        string calldata bio,
        string calldata portfolioUrl,
        string calldata githubUrl,
        string calldata skills
    ) external {
        require(bytes(name).length > 0, "Name required");
        require(bytes(title).length > 0, "Title required");

        bool isNew = !profiles[msg.sender].exists;

        profiles[msg.sender] = Profile({
            freelancer: msg.sender,
            name: name,
            title: title,
            domain: domain,
            hourlyRate: hourlyRate,
            bio: bio,
            portfolioUrl: portfolioUrl,
            githubUrl: githubUrl,
            skills: skills,
            kycVerified: profiles[msg.sender].kycVerified, // preserve existing
            createdAt: isNew ? block.timestamp : profiles[msg.sender].createdAt,
            exists: true
        });

        if (isNew) {
            _freelancerList.push(msg.sender);
            emit FreelancerRegistered(msg.sender, name);
        } else {
            emit FreelancerUpdated(msg.sender, name);
        }
    }

    function getFreelancerCount() external view returns (uint256) {
        return _freelancerList.length;
    }

    function getFreelancerAt(uint256 index) external view returns (address) {
        require(index < _freelancerList.length, "Index out of bounds");
        return _freelancerList[index];
    }

    function getAllFreelancers() external view returns (address[] memory) {
        return _freelancerList;
    }

    function getProfile(address freelancer) external view returns (Profile memory) {
        return profiles[freelancer];
    }

    function isRegistered(address freelancer) external view returns (bool) {
        return profiles[freelancer].exists;
    }
}
