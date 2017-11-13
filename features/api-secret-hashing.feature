Feature: API Secret hashing
  As a developer of mfa-api
  I want to store a one-way hash of an API Key's secret
  So that I can check a given API Secret against it later
  
  Scenario: Hash an API Secret
    Given I have an API Secret
    When I create a hash of the API Secret
    Then the hashed API Secret should NOT be empty
     And the hashed API Secret should NOT match the API Secret
  
  Scenario: Checking the correct API Secret against a hash
    Given I have an API Secret
      And I have a hash of the API Secret
    When I check the API Secret against the hashed API Secret
    Then the hashed API Secret check should have passed
  
  Scenario: Checking an incorrect API Secret against a hash
    Given I have an API Secret
      And I have a hash of the API Secret
      And I have a 2nd API Secret that is different
    When I check the 2nd API Secret against the hashed API Secret
    Then the hashed API Secret check should have FAILED
