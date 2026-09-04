import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DisputeConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentGranted: () => void;
  jobId: string | number;
  jobTitle: string;
  escrowAmount: string | number;
}

export function DisputeConsentModal({
  isOpen,
  onClose,
  onConsentGranted,
  jobId,
  jobTitle,
  escrowAmount
}: DisputeConsentModalProps) {
  const [attemptedResolution, setAttemptedResolution] = useState(false);
  const [understandPeerReview, setUnderstandPeerReview] = useState(false);
  const [agreeBindingVerdict, setAgreeBindingVerdict] = useState(false);

  const allChecked = attemptedResolution && understandPeerReview && agreeBindingVerdict;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Binding Dispute Protocol & Juror Consent">
      <div className="space-y-6">
        {/* Warning Banner */}
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex gap-3 text-sm text-warning">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>
            <strong>Warning:</strong> Initiating a dispute pauses the escrow for <strong>{jobTitle}</strong> ({escrowAmount} USDC). 
            The case will be escalated to decentralized peer jurors and this action <strong>cannot be undone</strong> once submitted on-chain.
          </p>
        </div>

        {/* Terms */}
        <div className="space-y-4 text-sm text-on-surface-variant">
          <h3 className="text-on-surface font-semibold mb-2">Binding Terms & Conditions (NDC):</h3>
          
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-surface-variant border border-outline text-xs font-bold text-on-surface mt-0.5">1</span>
            <p><strong>Escrow Lockup:</strong> Both client and freelancer acknowledge that funds remain frozen until the decentralized jury reaches quorum.</p>
          </div>
          
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-surface-variant border border-outline text-xs font-bold text-on-surface mt-0.5">2</span>
            <p><strong>Public Deliverable Review:</strong> Acknowledgment that submitted deliverables, preview sandboxes, and milestone specs will be unsealed and reviewed by selected high-reputation peer freelancers.</p>
          </div>
          
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-surface-variant border border-outline text-xs font-bold text-on-surface mt-0.5">3</span>
            <p><strong>Frivolous Dispute Penalty:</strong> Acknowledgment that bad-faith or malicious disputes may lead to forfeiture of dispute staking fees or SBT reputation slashing.</p>
          </div>
          
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-surface-variant border border-outline text-xs font-bold text-on-surface mt-0.5">4</span>
            <p><strong>Finality:</strong> Juror voting weights and smart contract execution are final and non-reversible.</p>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-4 border-t border-outline-variant">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors border ${attemptedResolution ? 'bg-primary border-primary' : 'bg-surface border-outline group-hover:border-primary'}`}>
              {attemptedResolution && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <input type="checkbox" className="hidden" checked={attemptedResolution} onChange={() => setAttemptedResolution(!attemptedResolution)} />
            <span className="text-sm text-on-surface font-medium">I have attempted to resolve this issue directly with the counterparty.</span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors border ${understandPeerReview ? 'bg-primary border-primary' : 'bg-surface border-outline group-hover:border-primary'}`}>
              {understandPeerReview && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <input type="checkbox" className="hidden" checked={understandPeerReview} onChange={() => setUnderstandPeerReview(!understandPeerReview)} />
            <span className="text-sm text-on-surface font-medium">I understand that peer jurors will inspect my deliverables and task history.</span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors border ${agreeBindingVerdict ? 'bg-primary border-primary' : 'bg-surface border-outline group-hover:border-primary'}`}>
              {agreeBindingVerdict && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <input type="checkbox" className="hidden" checked={agreeBindingVerdict} onChange={() => setAgreeBindingVerdict(!agreeBindingVerdict)} />
            <span className="text-sm text-on-surface font-medium">I agree to abide by the on-chain jury verdict as final and binding.</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant={allChecked ? "danger" : "outline"}
            className={allChecked ? "bg-error text-white hover:bg-error-container" : "opacity-50"}
            disabled={!allChecked}
            onClick={onConsentGranted}
          >
            Agree & Proceed
          </Button>
        </div>
      </div>
    </Modal>
  );
}
